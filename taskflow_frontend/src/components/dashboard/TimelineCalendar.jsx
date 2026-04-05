import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../shared/Modal';
import { api } from '../../services/api';
import CalendarDayCell from './CalendarDayCell';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useHolidayRegion } from '../../context/HolidayRegionContext';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  PROJECT_COLORS,
  daysShort,
  ALL_PROJECTS_FILTER,
  formatDayKey,
  hashToIndex,
  toColorWithAlpha,
  normalizeDate,
  buildCalendar,
  formatFriendlyDate,
  formatProjectKey,
} from '../../utils/calendarUtils';

const TimelineCalendar = ({ projects, tasks, token, isViewer = false }) => {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [calendarTasks, setCalendarTasks] = useState(tasks);
  const [holidaysByDay, setHolidaysByDay] = useState({});
  const [loadingHolidayMonthKey, setLoadingHolidayMonthKey] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(ALL_PROJECTS_FILTER);
  const [focusedDay, setFocusedDay] = useState(null);
  const [draggingTask, setDraggingTask] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [touchStartKey, setTouchStartKey] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const loadedMonthKeys = useRef(new Set());
  const monthRequestsInFlight = useRef(new Map());
  const { holidayRegion, holidayRegionOptions } = useHolidayRegion();

  const canReschedule = Boolean(token) && !isViewer;

  const dedupeHolidays = useCallback((rawHolidays) => {
    if (!Array.isArray(rawHolidays)) {
      return [];
    }

    const seen = new Set();
    return rawHolidays.filter((holiday) => {
      const name = String(holiday?.name || '').trim();
      const date = String(holiday?.date || '').trim();
      if (!name) {
        return false;
      }

      const key = `${name.toLowerCase()}::${date}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, []);

  useEffect(() => {
    setCalendarTasks(tasks);
  }, [tasks]);

  const projectOptions = useMemo(
    () =>
      projects
        .map((project) => ({
          label: project.name || 'Untitled project',
          value: formatProjectKey(project),
        }))
        .filter((option) => option.value),
    [projects],
  );

  const enrichedProjects = useMemo(
    () =>
      projects
        .map((project) => {
          const start = normalizeDate(project.startDate);
          const end = normalizeDate(project.endDate);
          if (!start || !end) return null;
          const projectKey = formatProjectKey(project);
          const color = PROJECT_COLORS[hashToIndex(projectKey || project.name)];
          return {
            ...project,
            start,
            end,
            color,
            projectKey,
          };
        })
        .filter(Boolean),
    [projects],
  );

  useEffect(() => {
    if (selectedProjectId === ALL_PROJECTS_FILTER) return;
    if (!projectOptions.some((option) => option.value === selectedProjectId)) {
      setSelectedProjectId(ALL_PROJECTS_FILTER);
    }
  }, [projectOptions, selectedProjectId]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const projectColorLookup = useMemo(() => {
    const map = {};
    enrichedProjects.forEach((project) => {
      if (project.projectKey) {
        map[project.projectKey] = project.color;
      }
    });
    return map;
  }, [enrichedProjects]);

  const visibleProjects = useMemo(() => {
    if (selectedProjectId === ALL_PROJECTS_FILTER) {
      return enrichedProjects;
    }
    return enrichedProjects.filter((project) => project.projectKey === selectedProjectId);
  }, [enrichedProjects, selectedProjectId]);

  const normalizedTasks = useMemo(
    () =>
      calendarTasks.map((task) => {
        const taskProjectKey =
          task.projectId ||
          task.project?._id ||
          task.projectKey ||
          (typeof task.project === 'string' ? task.project : null) ||
          task.projectName;
        const color =
          (taskProjectKey && projectColorLookup[taskProjectKey]) ||
          PROJECT_COLORS[hashToIndex(taskProjectKey || task.projectName || task._id)];
        return {
          ...task,
          projectKey: taskProjectKey,
          color,
        };
      }),
    [calendarTasks, projectColorLookup],
  );

  const visibleTasks = useMemo(() => {
    if (selectedProjectId === ALL_PROJECTS_FILTER) {
      return normalizedTasks;
    }
    return normalizedTasks.filter((task) => task.projectKey === selectedProjectId);
  }, [normalizedTasks, selectedProjectId]);

  const tasksByDay = useMemo(() => {
    const grouped = {};
    visibleTasks.forEach((task) => {
      const dueDate = normalizeDate(task.dueDate);
      if (!dueDate) return;
      const key = formatDayKey(dueDate);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });
    return grouped;
  }, [visibleTasks]);

  const calendarDays = useMemo(() => buildCalendar(viewDate).flat(), [viewDate]);
  const currentMonthKey = useMemo(
    () => `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`,
    [viewDate],
  );
  const currentMonthHolidayCount = useMemo(
    () =>
      Object.entries(holidaysByDay).reduce((count, [dayKey, holidays]) => {
        return dayKey.startsWith(currentMonthKey) ? count + holidays.length : count;
      }, 0),
    [currentMonthKey, holidaysByDay],
  );
  const holidayRegionLabel = useMemo(
    () => holidayRegionOptions.find((option) => option.value === holidayRegion)?.label || holidayRegion,
    [holidayRegion, holidayRegionOptions],
  );

  useEffect(() => {
    loadedMonthKeys.current.clear();
    monthRequestsInFlight.current.clear();
    setHolidaysByDay({});
    setLoadingHolidayMonthKey(null);
  }, [holidayRegion]);

  useEffect(() => {
    let cancelled = false;

    const loadMonthHolidays = async () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (loadedMonthKeys.current.has(monthKey)) {
        return;
      }

      setLoadingHolidayMonthKey(monthKey);

      let monthPromise = monthRequestsInFlight.current.get(monthKey);
      if (!monthPromise) {
        monthPromise = api.getHolidaysForMonth({ year, month, country: holidayRegion }, token);
        monthRequestsInFlight.current.set(monthKey, monthPromise);
      }

      try {
        const payload = await monthPromise;
        const holidaysByDayPayload = payload?.holidaysByDay || {};

        if (cancelled) {
          return;
        }

        const normalized = Object.entries(holidaysByDayPayload).reduce((acc, [dayKey, holidays]) => {
          acc[dayKey] = dedupeHolidays(holidays);
          return acc;
        }, {});

        setHolidaysByDay((prev) => ({
          ...prev,
          ...normalized,
        }));
        loadedMonthKeys.current.add(monthKey);
      } catch (error) {
        const isRateLimit = error?.message?.includes('429') || error?.message?.includes('too_many_requests');
        if (isRateLimit) {
          setFeedback({
            type: 'error',
            message: 'Holiday API rate limit reached while preloading this month.',
          });
        }
      } finally {
        if (monthRequestsInFlight.current.get(monthKey) === monthPromise) {
          monthRequestsInFlight.current.delete(monthKey);
        }
        setLoadingHolidayMonthKey((current) => (current === monthKey ? null : current));
      }
    };

    loadMonthHolidays();

    return () => {
      cancelled = true;
    };
  }, [dedupeHolidays, holidayRegion, token, viewDate]);

  const currentMonthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const todayKey = formatDayKey(new Date());

  const handleMonthChange = (direction) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleDayClick = (day) => {
    if (!(day instanceof Date) || Number.isNaN(day.getTime())) return;

    const key = formatDayKey(day);
    if (!key) return;

    setFocusedDay({ key, date: day });
  };

  const handleTaskReschedule = useCallback(
    async (task, targetDay) => {
      if (!canReschedule) {
        setFeedback({
          type: 'error',
          message: 'Login required to reschedule tasks.',
        });
        return;
      }

      const nextDate = new Date(targetDay);
      nextDate.setHours(12, 0, 0, 0);
      const isoString = nextDate.toISOString();

      setUpdatingTaskId(task._id);
      try {
        await api.updateTask(task._id, { dueDate: isoString }, token);
        setCalendarTasks((prev) =>
          prev.map((item) => (item._id === task._id ? { ...item, dueDate: isoString } : item)),
        );
        setFeedback({
          type: 'success',
          message: `Moved "${task.title}" to ${formatFriendlyDate(nextDate)}.`,
        });
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error.message || 'Failed to reschedule task.',
        });
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [canReschedule, token],
  );

  const dragDropHandlers = useDragAndDrop({
    canReschedule,
    setDraggingTask,
    setDropTargetKey,
    setFeedback,
    handleTaskReschedule,
    calendarDays,
    enrichedProjects,
    touchStartKey,
    setTouchStartKey,
    longPressTimer,
    setLongPressTimer,
    draggingTask,
    dropTargetKey,
  });

  const renderProjectsBackground = useCallback(
    (day) => {
      const projectsOnDay = visibleProjects.filter((project) => day >= project.start && day <= project.end);
      if (!projectsOnDay.length) return null;

      if (projectsOnDay.length === 1) {
        return (
          <div
            className="absolute inset-1 rounded-xl"
            style={{ backgroundColor: toColorWithAlpha(projectsOnDay[0].color, 0.25) }}
          />
        );
      }

      const gradientStops = projectsOnDay
        .map((project, index) => {
          const percentage = Math.round((index / (projectsOnDay.length - 1)) * 100);
          return `${toColorWithAlpha(project.color, 0.3)} ${percentage}%`;
        })
        .join(', ');

      return (
        <div
          className="absolute inset-1 rounded-xl"
          style={{ backgroundImage: `linear-gradient(135deg, ${gradientStops})` }}
        />
      );
    },
    [visibleProjects],
  );

  const activeDayTasks = focusedDay?.key ? tasksByDay[focusedDay.key] || [] : [];
  const activeDayHolidays = focusedDay?.key ? holidaysByDay[focusedDay.key] || [] : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Calendar</p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Delivery planner</h2>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Calendar information"
              >
                <InfoOutlinedIcon sx={{ fontSize: 18 }} />
              </button>
              {showInfoTooltip && (
                <div className="absolute left-0 top-7 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                    <p className="leading-relaxed">
                      Projects span the cells; task pills pinpoint critical executions.
                    </p>
                    <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Navigation</p>
                      <p className="mt-1 leading-relaxed">Use Previous/Next month buttons to navigate through time.</p>
                    </div>
                    <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Project Filter</p>
                      <p className="mt-1 leading-relaxed">Select "All Projects" or filter by a specific project.</p>
                    </div>
                    <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Holiday region</p>
                      <p className="mt-1 leading-relaxed">Currently showing public holidays for {holidayRegionLabel}.</p>
                    </div>
                    <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Interaction</p>
                      <p className="mt-1 leading-relaxed">
                        Click a day or hover to inspect its tasks.
                        {canReschedule && ' Drag tasks to reschedule instantly.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-300 text-slate-700 transition hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
              onClick={() => handleMonthChange(-1)}
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon />
            </button>
            <div className="min-w-[140px] text-center text-sm font-medium text-slate-900 dark:text-white">
              {currentMonthLabel}
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-300 text-slate-700 transition hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
              onClick={() => handleMonthChange(1)}
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon />
            </button>
          </div>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white pr-8 pl-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
            value={selectedProjectId}
            onChange={(event) => {
              const projectKey = event.target.value;
              setSelectedProjectId(projectKey);
              
              // Navigate to the first day of the selected project
              if (projectKey !== ALL_PROJECTS_FILTER) {
                const selectedProject = enrichedProjects.find((p) => p.projectKey === projectKey);
                if (selectedProject && selectedProject.start) {
                  setViewDate(new Date(selectedProject.start.getFullYear(), selectedProject.start.getMonth(), 1));
                }
              }
            }}
          >
            <option value={ALL_PROJECTS_FILTER}>All Projects</option>
            {projectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-2 text-sm ${feedback.type === 'error' ? 'border-rose-200 text-rose-700 dark:border-rose-500/50 dark:text-rose-100' : 'border-emerald-200 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-100'}`}
        >
          {feedback.message}
        </div>
      )}

      {!feedback && !loadingHolidayMonthKey && loadedMonthKeys.current.has(currentMonthKey) && currentMonthHolidayCount === 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          No public holidays fall in {currentMonthLabel} for {holidayRegionLabel}.
        </div>
      )}

      <div className="mt-6 space-y-2">
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:gap-2 sm:text-xs">
          {daysShort.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((day, index) => {
            if (!day || Number.isNaN(new Date(day).getTime())) {
              return <div key={`empty-${index}`} className="min-h-[84px] rounded-xl" />;
            }

            const key = formatDayKey(day);
            const isCurrentMonth = day.getMonth() === viewDate.getMonth();
            const tasksOnDay = tasksByDay[key] || [];
            const holidaysOnDay = holidaysByDay[key] || [];
            const isDropTarget = dropTargetKey === key;
            const hasTasks = tasksOnDay.length > 0;

            const isDayWithinProjectTimeline =
              dragDropHandlers.checkDayWithinProjectTimeline?.(
                day,
                draggingTask,
                enrichedProjects,
              ) ?? true;

            return (
              <CalendarDayCell
                key={key}
                day={day}
                tasksOnDay={tasksOnDay}
                holidaysOnDay={holidaysOnDay}
                isCurrentMonth={isCurrentMonth}
                isDropTarget={isDropTarget}
                isDayWithinProjectTimeline={isDayWithinProjectTimeline}
                todayKey={todayKey}
                canReschedule={canReschedule}
                draggingTask={draggingTask}
                updatingTaskId={updatingTaskId}
                renderProjectsBackground={renderProjectsBackground}
                handleDayClick={handleDayClick}
                handleDayBoxDragStart={(e) =>
                  dragDropHandlers.handleDayBoxDragStart?.(e, tasksOnDay, hasTasks)
                }
                handleTaskDragEnd={dragDropHandlers.handleTaskDragEnd || (() => {})}
                handleDayDragOver={dragDropHandlers.handleDayDragOver || (() => {})}
                handleTaskDragStart={dragDropHandlers.handleTaskDragStart || (() => {})}
                onDropTargetChange={setDropTargetKey}
                onDrop={(e) =>
                  dragDropHandlers.handleDayDrop?.(e, day, isDayWithinProjectTimeline)
                }
              />
            );
          })}
        </div>
      </div>

      {!projects.length && !tasks.length && (
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Add project dates and task due dates to visualize delivery cadence here.
        </p>
      )}

      <Modal
        isOpen={Boolean(focusedDay)}
        onClose={() => setFocusedDay(null)}
        title={focusedDay ? `Tasks • ${formatFriendlyDate(focusedDay.date)}` : 'Tasks'}
      >
        <div className="space-y-4">
          {(focusedDay?.date &&
              `${focusedDay.date.getFullYear()}-${String(focusedDay.date.getMonth() + 1).padStart(2, '0')}` ===
                loadingHolidayMonthKey) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              Loading holidays...
            </div>
          )}

          {!!activeDayHolidays.length && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                Holidays
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-100">
                {activeDayHolidays.map((holiday) => (
                  <li key={`${holiday.name}-${holiday.date || holiday.name}`}>{holiday.name}</li>
                ))}
              </ul>
            </div>
          )}

          {!activeDayTasks.length &&
            !activeDayHolidays.length &&
            (!focusedDay?.date ||
              `${focusedDay.date.getFullYear()}-${String(focusedDay.date.getMonth() + 1).padStart(2, '0')}` !==
                loadingHolidayMonthKey) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              No tasks or holidays on this day.
            </div>
          )}

          {activeDayTasks.map((task) => {
            const due = normalizeDate(task.dueDate);
            return (
              <div
                key={`modal-${task._id}`}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{task.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{task.projectName || 'Unassigned project'}</p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: toColorWithAlpha(task.color, 0.85), border: `1px solid ${task.color}` }}
                  >
                    {task.status || 'Scheduled'}
                  </span>
                </div>
                {task.description && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{task.description}</p>
                )}
                <dl className="mt-4 grid gap-4 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Due</dt>
                    <dd className="mt-1 text-base text-slate-900 dark:text-white">
                      {formatFriendlyDate(due) || 'No date'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Priority</dt>
                    <dd className="mt-1 text-base text-slate-900 dark:text-white">{task.priority || '—'}</dd>
                  </div>
                </dl>
                {canReschedule ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Tip: drag this task's pill on the calendar to move its due date.
                  </p>
                ) : (
                  <div></div>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default TimelineCalendar;
