import { formatDayKey } from '../utils/calendarUtils';

export const useDragAndDrop = ({
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
}) => {
  const handleTaskDragStart = (task, event) => {
    if (!canReschedule) return;
    setDraggingTask(task);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task._id);
  };

  const handleTaskDragEnd = () => {
    setDraggingTask(null);
    setDropTargetKey(null);
  };

  const handleDayDragOver = (event, key) => {
    if (!canReschedule || !draggingTask) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTargetKey !== key) {
      setDropTargetKey(key);
    }
  };

  const handleDayDrop = async (event, day, isDayWithinProjectTimeline) => {
    if (!canReschedule || !draggingTask) return;
    event.preventDefault();
    event.stopPropagation();

    if (!isDayWithinProjectTimeline) {
      setFeedback({
        type: 'error',
        message: 'Cannot move task outside of project timeline.',
      });
      setDraggingTask(null);
      setDropTargetKey(null);
      return;
    }

    await handleTaskReschedule(draggingTask, day);
    setDraggingTask(null);
    setDropTargetKey(null);
  };

  const handleDayBoxDragStart = (event, tasksOnDay, hasTasks) => {
    if (!canReschedule || !hasTasks) return;
    const taskToDrag = tasksOnDay[0];
    setDraggingTask(taskToDrag);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskToDrag._id);
  };

  const handleTouchStart = (event, key, tasksOnDay, hasTasks) => {
    if (!canReschedule || !hasTasks) return;
    setTouchStartKey(key);

    const timer = setTimeout(() => {
      setDraggingTask(tasksOnDay[0]);
      setDropTargetKey(null);
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchMove = (event, key) => {
    if (!draggingTask || touchStartKey !== key) {
      if (longPressTimer && !draggingTask) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
        setTouchStartKey(null);
      }
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dayCell = element?.closest('[data-day-key]');

    if (dayCell) {
      const targetKey = dayCell.getAttribute('data-day-key');
      setDropTargetKey(targetKey);
    }
  };

  const handleTouchEnd = (event, key, isDayWithinProjectTimeline) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!draggingTask || touchStartKey !== key) {
      setTouchStartKey(null);
      return;
    }

    event.preventDefault();

    if (dropTargetKey && dropTargetKey !== key) {
      const targetDay = calendarDays.find((d) => formatDayKey(d) === dropTargetKey);
      if (targetDay && isDayWithinProjectTimeline) {
        handleTaskReschedule(draggingTask, targetDay);
      } else if (targetDay && !isDayWithinProjectTimeline) {
        setFeedback({
          type: 'error',
          message: 'Cannot move task outside of project timeline.',
        });
      }
    }

    setDraggingTask(null);
    setDropTargetKey(null);
    setTouchStartKey(null);
  };

  const checkDayWithinProjectTimeline = (day, draggingTask, enrichedProjects) => {
    if (!draggingTask) return true;

    return enrichedProjects.some((project) => {
      const taskBelongsToProject =
        draggingTask.projectKey === project.projectKey ||
        draggingTask.projectId === project._id ||
        draggingTask.project?._id === project._id;

      if (taskBelongsToProject && project.start && project.end) {
        return day >= project.start && day <= project.end;
      }
      return true;
    });
  };

  return {
    handleTaskDragStart,
    handleTaskDragEnd,
    handleDayDragOver,
    handleDayDrop,
    handleDayBoxDragStart,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    checkDayWithinProjectTimeline,
  };
};
