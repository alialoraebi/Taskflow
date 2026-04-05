import { formatDayKey, formatFriendlyDate, normalizeDate, toColorWithAlpha } from '../../utils/calendarUtils';

const CalendarDayCell = ({
  day,
  tasksOnDay,
  holidaysOnDay = [],
  isCurrentMonth,
  isDropTarget,
  isDayWithinProjectTimeline,
  todayKey,
  canReschedule,
  draggingTask,
  touchStartKey,
  updatingTaskId,
  renderProjectsBackground,
  handleDayClick,
  handleDayBoxDragStart,
  handleTaskDragEnd,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleDayDragOver,
  handleTaskDragStart,
  onDropTargetChange,
  onDrop,
  // Additional props for task pill touch handling
  setTouchStartKey,
  setLongPressTimer,
  setDraggingTask,
  setDropTargetKey,
  dropTargetKey,
  longPressTimer,
  calendarDays,
  enrichedProjects,
  checkDayWithinProjectTimeline,
  handleTaskReschedule,
  onSetFeedback,
}) => {
  const key = formatDayKey(day);
  const hasTasks = tasksOnDay.length > 0;
  const hasHolidays = holidaysOnDay.length > 0;
  const isInteractive = Boolean(isCurrentMonth);

  // Mobile: Apply distinct task color as background overlay
  const mobileTaskStyle = hasTasks
    ? {
        backgroundColor: toColorWithAlpha(tasksOnDay[0].color, 0.3),
      }
    : {};

  // Prevent desktop drag on day box, only allow touch drag (mobile)
  const handleDayBoxDragStartWrapper = (e) => {
    // Check if it's a desktop drag (not touch-initiated)
    if (e.type === 'dragstart' && !touchStartKey) {
      e.preventDefault();
      return;
    }
    handleDayBoxDragStart(e);
  };

  return (
    <div
      data-day-key={key}
      draggable={false}
      onDragStart={handleDayBoxDragStartWrapper}
      onDragEnd={handleTaskDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`group relative h-14 overflow-hidden rounded-lg border p-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:min-h-[120px] sm:h-auto sm:rounded-xl sm:p-2 ${
        isCurrentMonth
          ? 'border-slate-200 sm:bg-white dark:border-slate-700 dark:sm:bg-slate-800/50'
          : 'border-slate-100 bg-slate-50/40 text-slate-400 dark:border-slate-800/50 dark:bg-slate-900/20'
      } ${isDropTarget && isDayWithinProjectTimeline ? 'border-indigo-400 ring-2 ring-indigo-200 dark:border-indigo-300 dark:ring-indigo-500/30' : ''} ${isDropTarget && !isDayWithinProjectTimeline ? 'border-rose-400 ring-2 ring-rose-200 dark:border-rose-300 dark:ring-rose-500/30' : ''} ${key === todayKey ? 'ring-2 ring-indigo-500/20' : ''} ${draggingTask && touchStartKey === key ? 'scale-105 opacity-50' : ''}`}
      style={mobileTaskStyle}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={`View ${tasksOnDay.length || 'no'} tasks and ${holidaysOnDay.length || 'no'} holidays scheduled for ${formatFriendlyDate(day)}`}
      onClick={() => handleDayClick(day)}
      onKeyDown={(event) => {
        if (!isInteractive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleDayClick(day);
        }
      }}
      onDragOver={(event) => {
        if (!isDayWithinProjectTimeline) {
          event.dataTransfer.dropEffect = 'none';
          return;
        }
        handleDayDragOver(event, key);
      }}
      onDragEnter={() => {
        if (draggingTask && isDayWithinProjectTimeline) {
          onDropTargetChange(key);
        }
      }}
      onDragLeave={() => isDropTarget && onDropTargetChange(null)}
      onDrop={onDrop}
    >
      {/* Keep project background for desktop */}
      {renderProjectsBackground(day)}

      <div className="relative z-10 flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-start justify-between text-[10px] font-semibold sm:text-xs">
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] sm:h-6 sm:w-6 sm:text-xs ${
              key === todayKey
                ? 'bg-indigo-500 text-white shadow-sm'
                : isCurrentMonth
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            {day.getDate()}
          </span>

          {hasHolidays && (
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 sm:text-[9px]">
              Holiday
            </span>
          )}

          {/* Mobile: Show task count badge */}
          {!!tasksOnDay.length && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[8px] font-bold text-white shadow-sm sm:hidden dark:bg-slate-200 dark:text-slate-800">
              {tasksOnDay.length}
            </span>
          )}

          {/* Desktop: Show task count text */}
          {!!tasksOnDay.length && (
            <span className="hidden text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:inline">
              {tasksOnDay.length}
            </span>
          )}
        </div>

        {hasHolidays && (
          <div className="mt-1 shrink-0">
            <p className="truncate text-[9px] font-semibold text-amber-700 dark:text-amber-200 sm:text-[10px]">
              {holidaysOnDay[0].name}
            </p>
            {holidaysOnDay.length > 1 && (
              <p className="text-[8px] text-amber-600/90 dark:text-amber-300/90 sm:text-[9px]">
                +{holidaysOnDay.length - 1} more
              </p>
            )}
          </div>
        )}

        {/* Show task pills on both mobile and desktop */}
        <div className="relative z-10 mt-1 flex-1">
          <div className="flex flex-col gap-0.5">
            {tasksOnDay.map((task) => (
              <div
                key={task._id}
                title={`${task.title} • ${task.projectName || 'Unassigned'} • Due ${formatFriendlyDate(
                  normalizeDate(task.dueDate),
                )}`}
                draggable={canReschedule}
                onDragStart={(event) => {
                  event.stopPropagation();
                  handleTaskDragStart(task, event);
                }}
                onDragEnd={handleTaskDragEnd}
                onMouseDown={(event) => {
                  // Prevent day click when clicking on task pill
                  event.stopPropagation();
                }}
                onTouchStart={(event) => {
                  if (!canReschedule) return;
                  // Stop propagation to prevent day box touch handler
                  event.stopPropagation();
                  // Start drag on this specific task
                  setTouchStartKey(key);
                  const timer = setTimeout(() => {
                    setDraggingTask(task);
                    setDropTargetKey(null);
                    if (window.navigator.vibrate) {
                      window.navigator.vibrate(50);
                    }
                  }, 500);
                  setLongPressTimer(timer);
                }}
                onTouchMove={(event) => {
                  if (!draggingTask || touchStartKey !== key) {
                    if (longPressTimer && !draggingTask) {
                      clearTimeout(longPressTimer);
                      setLongPressTimer(null);
                      setTouchStartKey(null);
                    }
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  const touch = event.touches[0];
                  const element = document.elementFromPoint(touch.clientX, touch.clientY);
                  const dayCell = element?.closest('[data-day-key]');
                  if (dayCell) {
                    const targetKey = dayCell.getAttribute('data-day-key');
                    setDropTargetKey(targetKey);
                  }
                }}
                onTouchEnd={(event) => {
                  if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                  }
                  if (!draggingTask || touchStartKey !== key) {
                    setTouchStartKey(null);
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  if (dropTargetKey && dropTargetKey !== key) {
                    const targetDay = calendarDays.find((d) => formatDayKey(d) === dropTargetKey);
                    const isDayWithinTimeline = checkDayWithinProjectTimeline(targetDay, draggingTask, enrichedProjects);
                    if (targetDay && isDayWithinTimeline) {
                      handleTaskReschedule(draggingTask, targetDay);
                    } else if (targetDay && !isDayWithinTimeline) {
                      onSetFeedback({
                        type: 'error',
                        message: 'Cannot move task outside of project timeline.',
                      });
                    }
                  }
                  setDraggingTask(null);
                  setDropTargetKey(null);
                  setTouchStartKey(null);
                }}
                className={`shrink-0 truncate rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm sm:px-2 sm:text-[10px] ${
                  canReschedule ? 'cursor-grab active:cursor-grabbing' : ''
                } ${updatingTaskId === task._id ? 'opacity-60' : ''}`}
                style={{
                  backgroundColor: toColorWithAlpha(task.color, 0.85),
                  border: `1px solid ${task.color}`,
                }}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop only: Hover popover */}
      {!!(tasksOnDay.length || holidaysOnDay.length) && (
        <div className="pointer-events-none absolute left-0 right-0 top-full z-20 hidden translate-y-2 rounded-xl border border-slate-200 bg-white p-3 text-[11px] shadow-2xl sm:group-hover:block dark:border-slate-700 dark:bg-slate-900 sm:left-2 sm:right-2">
          {!!holidaysOnDay.length && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                Holidays
              </p>
              <p className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-200">
                {holidaysOnDay.map((holiday) => holiday.name).join(', ')}
              </p>
            </div>
          )}

          {!!tasksOnDay.length && (
            <>
              <p className="mb-2 font-semibold text-slate-900 dark:text-white">
                {tasksOnDay.length} scheduled task{tasksOnDay.length === 1 ? '' : 's'}
              </p>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                {tasksOnDay.slice(0, 3).map((task) => (
                  <li key={`${task._id}-hover`} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.color }} />
                    <span className="truncate">{task.title}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarDayCell;
