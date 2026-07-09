"use client";

import {
  EVENT_CATEGORIES,
  type EventFormData,
  type EventPricingMode,
  type TicketingType,
} from "@/lib/events/types";
import {
  EVENT_PRICE_EXTERNAL_LABEL,
  EVENT_PRICE_PER_SEAT_LABEL,
  isExternalTicketing,
  isInternalTicketing,
  isTicketingSetupComplete,
} from "@/lib/events/pricing";
import { getCategoryExamples } from "@/lib/my-event/category-examples";
import { MY_EVENT_LINKED_VENUE_SEATING_HINT } from "@/lib/my-event/constants";
import { cn } from "@/lib/utils";

type EventTicketingSetupProps = {
  formData: EventFormData;
  onChange: (patch: Partial<EventFormData>) => void;
  setupComplete: boolean;
  onSetupComplete: () => void;
  onEditSetup: () => void;
  isEdit?: boolean;
  eventId?: number;
};

const choiceButtonClass = (active: boolean) =>
  cn(
    "rounded-2xl border p-4 text-right transition",
    active
      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/30 dark:border-blue-400 dark:bg-blue-500/15"
      : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/40"
  );

const smallChoiceClass = (active: boolean) =>
  cn(
    "rounded-xl px-4 py-2.5 text-sm font-bold transition",
    active
      ? "bg-blue-600 text-white"
      : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
  );

function resetToChannelStep(): Partial<EventFormData> {
  return {
    ticketingType: null,
    category: "",
    hasAssignedSeating: null,
    pricingMode: null,
    fixedPriceAmount: "",
    price: "",
  };
}

function pricingOptions(hasAssignedSeating: boolean): {
  value: EventPricingMode;
  title: string;
  description: string;
}[] {
  if (hasAssignedSeating) {
    return [
      {
        value: "fixed",
        title: "قیمت ثابت برای همه صندلی‌ها",
        description: "یک مبلغ واحد برای هر بلیت — در نقشه صندلی هم قابل تنظیم دقیق‌تر است.",
      },
      {
        value: "per_seat",
        title: "قیمت متفاوت برای هر صندلی",
        description: `نمایش «${EVENT_PRICE_PER_SEAT_LABEL}» — جزئیات در نقشه صندلی تعریف می‌شود.`,
      },
      {
        value: "free",
        title: "رایگان",
        description: "ورود بدون پرداخت برای همه صندلی‌ها.",
      },
    ];
  }

  return [
    {
      value: "fixed",
      title: "قیمت ثابت برای هر بلیت",
      description: "مثلاً: ۳۵۰٬۰۰۰ تومان — برای رویداد بدون صندلی ثابت.",
    },
    {
      value: "free",
      title: "رایگان",
      description: "ثبت‌نام یا ورود بدون پرداخت.",
    },
  ];
}

export default function EventTicketingSetup({
  formData,
  onChange,
  setupComplete,
  onSetupComplete,
  onEditSetup,
  isEdit = false,
  eventId,
}: EventTicketingSetupProps) {
  const usesLinkedVenue =
    formData.hasAssignedSeating === true && formData.venueTemplateId != null;

  if (setupComplete && isTicketingSetupComplete(formData)) {
    const channelLabel = isExternalTicketing(formData.ticketingType)
      ? "لینک به سایت فروشنده"
      : "فروش بلیت در بلیت‌مال";

    let pricingLabel = EVENT_PRICE_EXTERNAL_LABEL;
    if (isInternalTicketing(formData.ticketingType)) {
      if (formData.pricingMode === "free") pricingLabel = "رایگان";
      else if (formData.pricingMode === "per_seat") pricingLabel = EVENT_PRICE_PER_SEAT_LABEL;
      else pricingLabel = (formData.fixedPriceAmount || formData.price).trim() || "قیمت ثابت";
    }

    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 text-sm">
            <p className="font-black text-slate-800 dark:text-slate-100">تنظیمات فروش بلیت</p>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-bold">{channelLabel}</span>
              {isInternalTicketing(formData.ticketingType) ? (
                <>
                  {" · "}
                  <span>{formData.category}</span>
                  {" · "}
                  <span>
                    {formData.hasAssignedSeating ? "صندلی مشخص" : "بدون صندلی ثابت"}
                  </span>
                  {" · "}
                  <span>{pricingLabel}</span>
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(resetToChannelStep());
              onEditSetup();
            }}
            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-500/40 dark:bg-slate-900 dark:text-blue-300"
          >
            تغییر تنظیمات
          </button>
        </div>
      </div>
    );
  }

  const stepChannel = !formData.ticketingType;
  const stepCategory =
    isInternalTicketing(formData.ticketingType) && !formData.category;
  const stepSeating =
    isInternalTicketing(formData.ticketingType) &&
    Boolean(formData.category) &&
    formData.hasAssignedSeating === null;
  const stepPricing =
    isInternalTicketing(formData.ticketingType) &&
    formData.hasAssignedSeating !== null &&
    !formData.pricingMode;

  const showFixedAmount =
    isInternalTicketing(formData.ticketingType) && formData.pricingMode === "fixed";

  const showContinueButton =
    isInternalTicketing(formData.ticketingType) && isTicketingSetupComplete(formData);

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {stepChannel ? (
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
            {isEdit ? "تنظیمات فروش بلیت" : "بلیت این رویداد چگونه فروخته می‌شود؟"}
          </h2>
        </div>
      ) : isInternalTicketing(formData.ticketingType) ? (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <p className="text-sm font-bold text-blue-700 dark:text-blue-300">فروش در بلیت‌مال</p>
          <button
            type="button"
            onClick={() => onChange(resetToChannelStep())}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            تغییر نوع فروش
          </button>
        </div>
      ) : null}

      {stepChannel ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={choiceButtonClass(formData.ticketingType === "EXTERNAL_LINK")}
              onClick={() => {
                onChange({
                  ticketingType: "EXTERNAL_LINK" as TicketingType,
                  hasAssignedSeating: false,
                  pricingMode: null,
                  fixedPriceAmount: "",
                  price: EVENT_PRICE_EXTERNAL_LABEL,
                  category: formData.category || "کنسرت",
                });
                onSetupComplete();
              }}
            >
              <p className="font-black text-slate-800 dark:text-slate-100">لینک به سایت فروشنده</p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                مثل هنرتیکت یا سایت اصلی برگزارکننده — قیمت در بلیت‌مال ثبت نمی‌شود و لینک خرید در
                هر سانس وارد می‌کنید.
              </p>
            </button>
            <button
              type="button"
              className={choiceButtonClass(formData.ticketingType === "INTERNAL")}
              onClick={() =>
                onChange({
                  ticketingType: "INTERNAL" as TicketingType,
                  category: "",
                  hasAssignedSeating: null,
                  pricingMode: null,
                  fixedPriceAmount: "",
                  price: "",
                })
              }
            >
              <p className="font-black text-slate-800 dark:text-slate-100">فروش در بلیت‌مال</p>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                تیکتینگ داخلی با QR — مثل ثبت رویداد در My Event Studio؛ قیمت‌گذاری هدفمند و
                امکان صندلی‌گذاری.
              </p>
            </button>
          </div>
        </div>
      ) : null}

      {stepCategory ? (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">نوع رویداد چیست؟</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {EVENT_CATEGORIES.map((cat) => {
              const ex = getCategoryExamples(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChange({ category: cat })}
                  className={choiceButtonClass(formData.category === cat)}
                >
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">{cat}</p>
                  {ex ? (
                    <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      مثال: {ex.title}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {stepSeating ? (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            آیا برای میهمانان جایگاه صندلی مشخص تعریف شود؟
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onChange({ hasAssignedSeating: true, pricingMode: null, fixedPriceAmount: "" })
              }
              className={smallChoiceClass(formData.hasAssignedSeating === true)}
            >
              بله، صندلی مشخص
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({ hasAssignedSeating: false, pricingMode: null, fixedPriceAmount: "" })
              }
              className={smallChoiceClass(formData.hasAssignedSeating === false)}
            >
              خیر، بدون صندلی ثابت
            </button>
          </div>
        </div>
      ) : null}

      {stepPricing ? (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">مدل قیمت‌گذاری</p>
          <div className="space-y-2">
            {pricingOptions(formData.hasAssignedSeating === true).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({
                    pricingMode: option.value,
                    fixedPriceAmount: option.value === "fixed" ? formData.fixedPriceAmount : "",
                    price:
                      option.value === "free"
                        ? "رایگان"
                        : option.value === "per_seat"
                          ? EVENT_PRICE_PER_SEAT_LABEL
                          : formData.fixedPriceAmount,
                  })
                }
                className={cn(choiceButtonClass(formData.pricingMode === option.value), "w-full")}
              >
                <p className="font-bold text-slate-800 dark:text-slate-100">{option.title}</p>
                <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showFixedAmount ? (
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
            مبلغ هر بلیت
          </label>
          <input
            type="text"
            value={formData.fixedPriceAmount}
            placeholder="مثلاً: ۳۵۰٬۰۰۰ تومان"
            onChange={(e) =>
              onChange({ fixedPriceAmount: e.target.value, price: e.target.value })
            }
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      ) : null}

      {formData.hasAssignedSeating === true && !stepSeating && !stepPricing ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
          {usesLinkedVenue ? (
            <p className="text-sm leading-7 text-violet-800 dark:text-violet-200">
              {MY_EVENT_LINKED_VENUE_SEATING_HINT}
            </p>
          ) : eventId ? (
            <p className="text-sm leading-7 text-violet-800 dark:text-violet-200">
              پس از ذخیره رویداد می‌توانید نقشه صندلی را برای این رویداد تنظیم کنید.
            </p>
          ) : (
            <p className="text-sm leading-7 text-violet-800 dark:text-violet-200">
              پس از ثبت رویداد، در صورت نیاز نقشه صندلی را برای این رویداد تعریف کنید.
            </p>
          )}
        </div>
      ) : null}

      {showContinueButton ? (
        <button
          type="button"
          onClick={onSetupComplete}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-700"
        >
          ادامه و تکمیل اطلاعات رویداد
        </button>
      ) : null}
    </div>
  );
}
