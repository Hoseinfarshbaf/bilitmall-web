export const SYSTEM_ROLE_SLUGS = {
  user: "user",
  manager: "manager",
  admin: "admin",
  organizer: "organizer",
} as const;

export type SystemRoleSlug =
  (typeof SYSTEM_ROLE_SLUGS)[keyof typeof SYSTEM_ROLE_SLUGS];

export const SYSTEM_ROLES: {
  slug: SystemRoleSlug;
  name: string;
  description: string;
}[] = [
  {
    slug: SYSTEM_ROLE_SLUGS.user,
    name: "کاربر بلیت‌مال",
    description: "خریدار عادی سایت بلیت‌مال",
  },
  {
    slug: SYSTEM_ROLE_SLUGS.manager,
    name: "مدیر",
    description: "مدیر داخلی بلیت‌مال",
  },
  {
    slug: SYSTEM_ROLE_SLUGS.admin,
    name: "ادمین",
    description: "دسترسی کامل پنل ادمین",
  },
  {
    slug: SYSTEM_ROLE_SLUGS.organizer,
    name: "برگزارکننده",
    description: "برگزارکننده رویداد (شامل حساب My Event)",
  },
];

export type RoleSummary = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

/** ساخت slug امن از نام فارسی/لاتین برای نقش سفارشی */
export function slugifyRoleName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (base) return `custom-${base}`.slice(0, 64);

  return `custom-${Date.now().toString(36)}`;
}

export function isSystemRoleSlug(slug: string): boolean {
  return (Object.values(SYSTEM_ROLE_SLUGS) as string[]).includes(slug);
}
