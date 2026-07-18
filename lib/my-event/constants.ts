export const MY_EVENT_BRAND = "My Event";
export const MY_EVENT_STUDIO = "My Event Studio";
/** عنوان تب مرورگر برای مسیرهای /my-event */
export const MY_EVENT_STUDIO_TAB_TITLE = "استودیو مای‌ایونت";
export const MY_EVENT_EVENT_SOURCE = "my_event";

/** نمونه لینک عمومی: afra.bilitmall.com/dorehami */
export const MY_EVENT_URL_EXAMPLE = "afra.bilitmall.com/dorehami";

export const MY_EVENT_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
  active: "فعال",
  suspended: "مسدود",
};

export const MY_EVENT_EVENT_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تأیید",
  active: "منتشر شده",
  rejected: "رد شده",
  cancelled: "لغو شده",
};

export const MY_EVENT_PENDING_CHANGE_LABELS = {
  event: "ویرایش‌شده رویداد",
  venue: "ویرایش‌شده سالن",
} as const;

export const BILITMALL_LISTING_LABELS = {
  notRequested: "فقط صفحه اختصاصی",
  pending: "در انتظار تأیید بلیت‌مال",
  approved: "منتشر در بلیت‌مال",
  rejected: "رد شده در بلیت‌مال",
} as const;

export const MY_EVENT_REGISTRATION_SUCCESS_MESSAGE =
  "ثبت‌نام شما انجام شد. پس از تأیید، از طریق پیامک به شما اعلام خواهد شد.";

export const MY_EVENT_EVENT_SUBMIT_SUCCESS_MESSAGE =
  "رویداد ثبت شد. پس از تأیید ادمین، از طریق پیامک به شما اعلام خواهد شد.";

export const MY_EVENT_SEATING_DESIGN_HINT =
  "محل اجرا را در استودیو طراحی کنید و قیمت صندلی‌ها را آنجا مشخص کنید.";

export const MY_EVENT_LINKED_VENUE_SEATING_HINT =
  "سالن از فهرست تأییدشده بلیت‌مال انتخاب شده — نقشه صندلی همان سالن اعمال می‌شود و توسط برگزارکننده قابل تغییر نیست.";

export const MY_EVENT_DESIGN_SEATING_CTA = "طراحی محل اجرا و قیمت‌گذاری";
export const MY_EVENT_VIEW_LINKED_VENUE_CTA = (venueName: string) =>
  `ورود به صحنه ${venueName}`;

export function eventUsesLinkedVenueSeating(event: {
  hasAssignedSeating?: boolean;
  venueTemplateId?: number | null;
}): boolean {
  return Boolean(event.hasAssignedSeating && event.venueTemplateId);
}

export function isMyEventEventApproved(event: {
  status: string;
  published: boolean;
}): boolean {
  return event.status === "active" && event.published;
}
