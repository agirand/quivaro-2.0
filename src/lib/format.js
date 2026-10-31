import { format, addDays, parseISO, differenceInCalendarDays } from 'date-fns';

export const today = () => format(new Date(), 'yyyy-MM-dd');
export const inDays = (n) => format(addDays(new Date(), n), 'yyyy-MM-dd');
export const money = (n) => '$' + Math.round(n || 0).toLocaleString();
export const fdate = (s) => (s ? format(parseISO(s), 'MMM d, yyyy') : '—');
export const daysFrom = (s) => differenceInCalendarDays(parseISO(s), new Date());
export const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());