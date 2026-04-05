export const PROJECT_COLORS = [
  '#6366f1', // indigo
  '#0284c7', // sky
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#7c3aed', // violet
];

export const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ALL_PROJECTS_FILTER = 'ALL';

export const formatDayKey = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

export const hashToIndex = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PROJECT_COLORS.length;
};

export const toColorWithAlpha = (hexColor, alpha = 0.2) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const normalizeDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

export const buildCalendar = (yearOrDate, month) => {
  const baseDate =
    yearOrDate instanceof Date
      ? yearOrDate
      : new Date(yearOrDate, month, 1);

  if (Number.isNaN(baseDate.getTime())) {
    return [];
  }

  const year = baseDate.getFullYear();
  const monthIndex = baseDate.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const weeks = [];
  let week = new Array(7).fill(null);

  for (let i = 0; i < startingDayOfWeek; i++) {
    week[i] = null;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayIndex = (startingDayOfWeek + day - 1) % 7;
    week[dayIndex] = new Date(year, monthIndex, day);

    if (dayIndex === 6 || day === daysInMonth) {
      weeks.push([...week]);
      week = new Array(7).fill(null);
    }
  }

  return weeks;
};

export const formatFriendlyDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

export const formatProjectKey = (project) => {
  return project?._id || project?.id || '';
};
