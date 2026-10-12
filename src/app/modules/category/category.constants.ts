export const CATEGORY_SEARCHABLE_FIELDS = ['name'];

export const CATEGORY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type CATEGORY_STATUS_TYPE =
  (typeof CATEGORY_STATUS)[keyof typeof CATEGORY_STATUS];
export const CATEGORY_STATUS_ENUM = Object.values(CATEGORY_STATUS);
