import type { EventFormData, EventItem, EventPricingMode, TicketingType } from "./types";

export const EVENT_PRICE_PER_SEAT_LABEL = "قیمت بر اساس صندلی";
export const EVENT_PRICE_EXTERNAL_LABEL = "خرید از سایت فروشنده";

export function isInternalTicketing(
  ticketingType: TicketingType | null | undefined
): boolean {
  return ticketingType === "INTERNAL";
}

export function isExternalTicketing(
  ticketingType: TicketingType | null | undefined
): boolean {
  return ticketingType === "EXTERNAL_LINK";
}

export function inferPricingMode(event: {
  price: string;
  hasAssignedSeating?: boolean;
  ticketingType?: TicketingType;
}): EventPricingMode {
  if (isExternalTicketing(event.ticketingType)) {
    return "fixed";
  }

  const price = event.price.trim();
  if (!price || price === "رایگان") return "free";
  if (
    price === EVENT_PRICE_PER_SEAT_LABEL ||
    (event.hasAssignedSeating && /صندلی|متغیر/.test(price))
  ) {
    return "per_seat";
  }
  return "fixed";
}

export type MyEventPriceInput = {
  hasAssignedSeating?: boolean | null;
  pricingMode?: EventPricingMode | null;
  fixedPriceAmount?: string;
};

/** قیمت ذخیره‌شده برای رویداد My Event. */
export function resolveMyEventSubmittedPrice(input: MyEventPriceInput): string {
  if (input.hasAssignedSeating === true) {
    if (input.pricingMode === "free") return "رایگان";
    return EVENT_PRICE_PER_SEAT_LABEL;
  }

  if (input.pricingMode === "fixed") {
    return (input.fixedPriceAmount ?? "").trim();
  }

  return "رایگان";
}

export function validateMyEventPricing(input: MyEventPriceInput): string | null {
  if (input.hasAssignedSeating === null || input.hasAssignedSeating === undefined) {
    return "لطفاً نوع صندلی‌گذاری را مشخص کنید.";
  }

  if (input.hasAssignedSeating === true) {
    return null;
  }

  if (input.pricingMode !== "free" && input.pricingMode !== "fixed") {
    return "لطفاً مدل قیمت‌گذاری را مشخص کنید.";
  }

  if (input.pricingMode === "fixed" && !(input.fixedPriceAmount ?? "").trim()) {
    return "لطفاً مبلغ بلیت را وارد کنید.";
  }

  return null;
}

export function eventToMyEventPricingFields(event: {
  price: string;
  hasAssignedSeating?: boolean;
}): Pick<MyEventPriceInput, "pricingMode" | "fixedPriceAmount"> {
  const pricingMode = inferPricingMode({
    price: event.price,
    hasAssignedSeating: event.hasAssignedSeating === true,
    ticketingType: "INTERNAL",
  });

  if (event.hasAssignedSeating === true) {
    return {
      pricingMode: pricingMode === "free" ? "free" : "per_seat",
      fixedPriceAmount: "",
    };
  }

  if (pricingMode === "fixed") {
    return { pricingMode: "fixed", fixedPriceAmount: event.price };
  }

  if (pricingMode === "free") {
    return { pricingMode: "free", fixedPriceAmount: "" };
  }

  return { pricingMode: null, fixedPriceAmount: "" };
}

/** اگر همه صندلی‌های قابل رزرو قیمت صفر داشته باشند، رویداد رایگان است. */
export function seatingLayoutIsFree(layout: {
  defaultPriceRial?: number;
  cells: { type: string; priceRial?: number }[];
}): boolean {
  const seats = layout.cells.filter((cell) => cell.type === "seat");
  if (seats.length === 0) {
    return (layout.defaultPriceRial ?? 0) <= 0;
  }
  return seats.every((seat) => (seat.priceRial ?? 0) <= 0);
}

export function resolveFormPrice(form: EventFormData): string {
  if (isExternalTicketing(form.ticketingType)) {
    return form.price.trim() || EVENT_PRICE_EXTERNAL_LABEL;
  }

  if (form.pricingMode === "free") return "رایگان";
  if (form.pricingMode === "per_seat") return EVENT_PRICE_PER_SEAT_LABEL;
  if (form.pricingMode === "fixed") {
    return (form.fixedPriceAmount || form.price).trim();
  }

  return form.price.trim();
}

export function pricingModeRequiresAmount(mode: EventPricingMode | null): boolean {
  return mode === "fixed";
}

export function isTicketingSetupComplete(form: EventFormData): boolean {
  if (!form.ticketingType) return false;

  if (isExternalTicketing(form.ticketingType)) {
    return true;
  }

  if (!form.category) return false;
  if (form.hasAssignedSeating === null) return false;
  if (!form.pricingMode) return false;

  if (pricingModeRequiresAmount(form.pricingMode)) {
    return Boolean((form.fixedPriceAmount || form.price).trim());
  }

  return true;
}

export function validateEventFormBusinessRules(form: EventFormData): string | null {
  if (!form.title?.trim() || !form.place?.trim()) {
    return "عنوان و مکان الزامی است.";
  }

  if (!form.ticketingType) {
    return "نوع فروش بلیت را مشخص کنید.";
  }

  if (isInternalTicketing(form.ticketingType)) {
    if (!form.category) return "دسته رویداد را انتخاب کنید.";
    if (form.hasAssignedSeating === null) {
      return "نوع صندلی‌گذاری را مشخص کنید.";
    }
    if (!form.pricingMode) return "مدل قیمت‌گذاری را مشخص کنید.";
    if (pricingModeRequiresAmount(form.pricingMode)) {
      if (!(form.fixedPriceAmount || form.price).trim()) {
        return "قیمت بلیت را وارد کنید.";
      }
    }
  }

  if (!form.days?.length) {
    return "حداقل یک روز و سانس برای رویداد لازم است.";
  }

  if (isExternalTicketing(form.ticketingType)) {
    const hasPurchaseLink = form.days.some((day) =>
      day.sessions.some((session) => session.purchaseUrl?.trim())
    );
    if (!hasPurchaseLink) {
      return "برای رویداد با لینک خارجی، حداقل یک لینک خرید سانس لازم است.";
    }
  }

  return null;
}

export function eventToFormTicketingFields(event: EventItem): Pick<
  EventFormData,
  "ticketingType" | "hasAssignedSeating" | "pricingMode" | "fixedPriceAmount" | "price"
> {
  const ticketingType =
    event.ticketingType ??
    (event.category === "ایونت" ? "INTERNAL" : "EXTERNAL_LINK");
  const pricingMode = inferPricingMode({
    price: event.price,
    hasAssignedSeating: event.hasAssignedSeating,
    ticketingType,
  });

  return {
    ticketingType,
    hasAssignedSeating: event.hasAssignedSeating ?? false,
    pricingMode: isExternalTicketing(ticketingType) ? null : pricingMode,
    fixedPriceAmount: pricingMode === "fixed" ? event.price : "",
    price: event.price,
  };
}
