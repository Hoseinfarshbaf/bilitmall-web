export const MY_EVENT_CATEGORIES = ["کنسرت", "تئاتر", "ایونت"] as const;

export type MyEventCategory = (typeof MY_EVENT_CATEGORIES)[number];

export function isValidMyEventCategory(value: string): value is MyEventCategory {
  return (MY_EVENT_CATEGORIES as readonly string[]).includes(value);
}
