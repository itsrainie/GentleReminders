import { format, isValid, parseISO } from 'date-fns';

export const formatDate = (dateString: string | Date | null): string => {
  if (!dateString) {
    return 'Unknown date';
  }
  
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  
  if (!isValid(date)) {
    return 'Invalid date';
  }
  
  return format(date, 'MMM d, yyyy');
};
