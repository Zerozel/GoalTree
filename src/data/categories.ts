import { Category } from './types';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'health', label: 'Health' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

export function categoryLabel(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? 'Other';
}
