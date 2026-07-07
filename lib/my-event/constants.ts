export const MY_EVENT_BRAND = "My Event";
export const MY_EVENT_STUDIO = "My Event Studio";
export const MY_EVENT_EVENT_SOURCE = "my_event";

/** نمونه لینک عمومی: cofferoze.myevent.ae/summer-workshop */
export const MY_EVENT_URL_EXAMPLE = "cofferoze.myevent.ae/summer-workshop";

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

export const MY_EVENT_SEATING_AFTER_APPROVAL_HINT =
  "پس از تأیید رویداد توسط ادمین، دکمه «ساخت صحنه» کنار «مشاهده صفحه» فعال می‌شود و می‌توانید نقشه سالن را طراحی کنید.";

export const MY_EVENT_LINKED_VENUE_SEATING_HINT =
  "سالن از فهرست تأییدشده انتخاب شده — نقشه صندلی همان سالن برای رویداد اعمال می‌شود و نیازی به طراحی مجدد صحنه نیست.";

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
