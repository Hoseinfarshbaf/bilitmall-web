"use client";

import "@/lib/dom-resilience";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  Upload,
  X,
  CalendarDays,
  Armchair,
  FileText,
  ImageIcon,
  MapPin,
  Megaphone,
  Sparkles,
  CircleAlert,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CityAutocomplete from "@/components/CityAutocomplete";
import {
  type EventDay,
} from "@/lib/events/types";
import {
  normalizeDateString,
  normalizeEventDays,
  normalizeTimeString,
} from "@/lib/events/date-utils";
import { hasUploadedImage } from "@/lib/events/helpers";
import { EVENT_CARD_IMAGE_RECOMMENDED_TEXT } from "@/lib/events/image-specs";
import { processEventImageFile } from "@/lib/events/process-event-image";
import EventImagePreviews from "@/components/admin/EventImagePreviews";
import { MY_EVENT_CATEGORIES } from "@/lib/my-event/categories";
import {
  MY_EVENT_SEATING_DESIGN_HINT,
  MY_EVENT_LINKED_VENUE_SEATING_HINT,
  MY_EVENT_DESIGN_SEATING_CTA,
  MY_EVENT_VIEW_LINKED_VENUE_CTA,
} from "@/lib/my-event/constants";
import { getCategoryExamples } from "@/lib/my-event/category-examples";
import { formatMyEventEventLinkPreview } from "@/lib/my-event/domains";
import {
  buildPublicEventSlug,
  normalizePublicEventSlug,
} from "@/lib/my-event/public-slugs";
import VenuePlaceAutocomplete from "@/components/my-event/VenuePlaceAutocomplete";
import EventSessionScheduleEditor from "@/components/events/EventSessionScheduleEditor";
import PersianDateField from "@/components/events/PersianDateField";
import SeatingStudio from "@/components/seating/SeatingStudio";
import type { EventPricingMode } from "@/lib/events/types";
import { validateMyEventPricing } from "@/lib/events/pricing";
import { countBookableSeats, createEmptyLayout, normalizeLayout } from "@/lib/seating/layout";
import type { SeatingLayout } from "@/lib/seating/types";

export type MyEventEventFormValues = {
  title: string;
  publicEventSlug: string;
  city: string;
  category: string;
  place: string;
  venueTemplateId: number | null;
  placeAddress: string;
  description: string;
  image: string;
  days: EventDay[];
  hasAssignedSeating: boolean | null;
  pricingMode: EventPricingMode | null;
  fixedPriceAmount: string;
  listOnBilitmall: boolean;
  publishOnMyEvent: boolean;
  seatingLayout?: SeatingLayout | null;
};

type MyEventEventFormProps = {
  organizerSlug: string;
  eventId?: number;
  hasSeatingPlan?: boolean;
  initialValues?: Partial<MyEventEventFormValues> | null;
  onSubmit: (
    values: MyEventEventFormValues,
    imageFile: File | null
  ) => Promise<{ image?: string } | void>;
  loading?: boolean;
  submitLabel?: string;
  isEdit?: boolean;
};

export const emptyMyEventFormValues: MyEventEventFormValues = {
  title: "",
  publicEventSlug: "",
  city: "",
  category: "",
  place: "",
  venueTemplateId: null,
  placeAddress: "",
  description: "",
  image: "",
  days: [],
  hasAssignedSeating: null,
  pricingMode: null,
  fixedPriceAmount: "",
  listOnBilitmall: false,
  publishOnMyEvent: true,
  seatingLayout: null,
};

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white";
const inputErrorClass =
  "border-red-400 focus:border-red-500 dark:border-red-500/60 dark:focus:border-red-400";
const labelClass = "mb-2 block text-sm font-bold text-neutral-700 dark:text-slate-300";

type FormFieldKey =
  | "title"
  | "publicEventSlug"
  | "city"
  | "place"
  | "placeAddress"
  | "image"
  | "dates"
  | "hasAssignedSeating"
  | "pricingMode"
  | "fixedPriceAmount"
  | "publishChannels"
  | "description";

type FormValidationError = {
  field: FormFieldKey;
  message: string;
};

function serializeFormSnapshot(values: MyEventEventFormValues): string {
  return JSON.stringify({
    title: values.title.trim(),
    publicEventSlug: normalizePublicEventSlug(values.publicEventSlug),
    city: values.city.trim(),
    category: values.category.trim(),
    place: values.place.trim(),
    venueTemplateId: values.venueTemplateId,
    placeAddress: values.placeAddress.trim(),
    description: values.description.trim(),
    image: values.image.trim(),
    days: normalizeEventDays(values.days),
    hasAssignedSeating: values.hasAssignedSeating,
    pricingMode: values.pricingMode,
    fixedPriceAmount: values.fixedPriceAmount.trim(),
    listOnBilitmall: values.listOnBilitmall === true,
    publishOnMyEvent: values.publishOnMyEvent !== false,
    seatingLayout: values.seatingLayout ?? null,
  });
}

function toPersianPickerDate(date: string): DateObject {
  return new DateObject({
    date: normalizeDateString(date),
    format: "YYYY/MM/DD",
    calendar: persian,
    locale: persian_fa,
  });
}

/** جابه‌جایی مرحله بعد از بسته شدن overlayها و یک فریم رندر — جلوگیری از تداخل DOM */
function scheduleWizardStepChange(apply: () => void) {
  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  // دو tick تا listenerهای blur/close و هر mutation خارجی قبل از unmount تمام شوند
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      apply();
    });
  }, 0);
}

function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs font-bold leading-5 text-red-600 dark:text-red-400">
      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

type FormSectionProps = {
  step: number;
  title: string;
  description: string;
  icon: ReactNode;
  accent?: "emerald" | "sky" | "violet" | "amber" | "rose";
  children: ReactNode;
  className?: string;
};

const SECTION_STEP_LABELS = ["۱", "۲", "۳", "۴", "۵", "۶", "۷"] as const;

const WIZARD_STEPS = [
  {
    id: 1,
    title: "اطلاعات اصلی رویداد",
    shortTitle: "اطلاعات",
    description: "نام و لینک صفحه اختصاصی رویداد را مشخص کنید.",
    icon: Sparkles,
    accent: "emerald" as const,
  },
  {
    id: 2,
    title: "مکان برگزاری",
    shortTitle: "مکان",
    description: "شهر و محل رویداد را انتخاب کنید.",
    icon: MapPin,
    accent: "sky" as const,
  },
  {
    id: 3,
    title: "تصویر رویداد",
    shortTitle: "تصویر",
    description: "یک تصویر واضح برای کارت رویداد آپلود کنید.",
    icon: ImageIcon,
    accent: "rose" as const,
  },
  {
    id: 4,
    title: "تاریخ و سانس‌ها",
    shortTitle: "تاریخ",
    description: "بازه برگزاری را مشخص کنید، سپس برای هر روز سانس تعیین کنید.",
    icon: CalendarDays,
    accent: "emerald" as const,
  },
  {
    id: 5,
    title: "صندلی و قیمت‌گذاری",
    shortTitle: "صندلی",
    description: "جایگاه صندلی و مدل قیمت بلیت را مشخص کنید.",
    icon: Armchair,
    accent: "violet" as const,
  },
  {
    id: 6,
    title: "کانال‌های انتشار",
    shortTitle: "انتشار",
    description:
      "می‌توانید هر دو را با هم انتخاب کنید.",
    icon: Megaphone,
    accent: "amber" as const,
  },
  {
    id: 7,
    title: "توضیحات",
    shortTitle: "توضیحات",
    description: "در صورت تمایل توضیحات رویداد را بنویسید، سپس ثبت را بزنید تا برای تأیید ادمین ارسال شود.",
    icon: FileText,
    accent: "sky" as const,
  },
] as const;

const TOTAL_STEPS = WIZARD_STEPS.length;

const SECTION_ACCENTS = {
  emerald: {
    header: "from-brand-500/10 to-transparent",
    icon: "text-brand-600 dark:text-brand-400",
  },
  sky: {
    header: "from-sky-500/10 to-transparent",
    icon: "text-sky-600 dark:text-sky-400",
  },
  violet: {
    header: "from-violet-500/10 to-transparent",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    header: "from-amber-500/10 to-transparent",
    icon: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    header: "from-rose-500/10 to-transparent",
    icon: "text-rose-600 dark:text-rose-400",
  },
} as const;

function FormSection({
  step,
  title,
  description,
  icon,
  accent = "emerald",
  children,
  className,
}: FormSectionProps) {
  const tones = SECTION_ACCENTS[accent];
  const stepLabel = SECTION_STEP_LABELS[step - 1] ?? String(step);

  return (
    <section
      className={cn(
        "overflow-visible rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5",
        className
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3 border-b border-neutral-100 bg-linear-to-l px-4 py-4 dark:border-white/10",
          tones.header
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-black text-white dark:bg-white dark:text-neutral-900">
          {stepLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={tones.icon}>{icon}</span>
            <h2 className="text-base font-black text-neutral-900 dark:text-white sm:text-lg">
              <span>{title}</span>
            </h2>
          </div>
          <p className="mt-1 text-xs leading-6 text-neutral-500 dark:text-slate-400">
            <span>{description}</span>
          </p>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function WizardProgress({
  currentStep,
  onGoToStep,
}: {
  currentStep: number;
  onGoToStep: (step: number) => void;
}) {
  const remaining = TOTAL_STEPS - currentStep;
  const percent = Math.round((currentStep / TOTAL_STEPS) * 100);
  const currentMeta = WIZARD_STEPS[currentStep - 1];

  return (
    <div
      translate="no"
      className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400">
            <span>مرحله </span>
            <span>{SECTION_STEP_LABELS[currentStep - 1]}</span>
            <span> از </span>
            <span>{SECTION_STEP_LABELS[TOTAL_STEPS - 1]}</span>
          </p>
          <p className="mt-1 text-base font-black text-neutral-900 dark:text-white">
            <span>{currentMeta?.title}</span>
          </p>
        </div>
        <p className="text-xs font-bold text-neutral-500 dark:text-slate-400">
          {remaining === 0 ? (
            <span>آخرین مرحله</span>
          ) : (
            <span>
              <span>{SECTION_STEP_LABELS[remaining - 1] ?? remaining}</span>
              <span> مرحله باقی‌مانده</span>
            </span>
          )}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="flex gap-1.5 overflow-x-auto pb-0.5 sm:gap-2">
        {WIZARD_STEPS.map((step) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          const reachable = step.id <= currentStep;

          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onGoToStep(step.id)}
                title={step.title}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition",
                  reachable ? "cursor-pointer" : "cursor-default opacity-50",
                  active && "bg-brand-500/10",
                  done && "hover:bg-neutral-50 dark:hover:bg-white/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition",
                    done && "bg-brand-600 text-white",
                    active && "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900",
                    !done &&
                      !active &&
                      "bg-neutral-100 text-neutral-400 dark:bg-white/10 dark:text-slate-500"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <span>{SECTION_STEP_LABELS[step.id - 1]}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "hidden truncate text-[10px] font-bold sm:block",
                    active
                      ? "text-brand-700 dark:text-brand-300"
                      : "text-neutral-400 dark:text-slate-500"
                  )}
                >
                  <span>{step.shortTitle}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function MyEventEventForm({
  organizerSlug,
  eventId,
  hasSeatingPlan = false,
  initialValues,
  onSubmit,
  loading,
  submitLabel = "ثبت رویداد",
  isEdit = false,
}: MyEventEventFormProps) {
  const [formData, setFormData] = useState<MyEventEventFormValues>(emptyMyEventFormValues);
  const [slugTouched, setSlugTouched] = useState(false);
  const [startPickerValue, setStartPickerValue] = useState<DateObject | null>(null);
  const [endPickerValue, setEndPickerValue] = useState<DateObject | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [formError, setFormError] = useState<FormValidationError | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [studioOpen, setStudioOpen] = useState(false);
  const [venuePreview, setVenuePreview] = useState<{
    name: string;
    layout: SeatingLayout;
  } | null>(null);
  const [venuePreviewLoading, setVenuePreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Partial<Record<FormFieldKey, HTMLElement | null>>>({});
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const formInitializedRef = useRef(false);
  const baselineSnapshotRef = useRef<string | null>(null);

  const setFieldRef = (field: FormFieldKey) => (node: HTMLElement | null) => {
    fieldRefs.current[field] = node;
  };

  const clearFieldError = (field: FormFieldKey) => {
    setFormError((current) => (current?.field === field ? null : current));
  };

  const fieldHasError = (field: FormFieldKey) => formError?.field === field;
  const activeFieldMessage = formError?.message ?? "";

  const closeWizardOverlays = () => {
    setStudioOpen(false);
    setVenuePreview(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialValues) {
        // فقط یک‌بار فرم خالی را آماده کن؛ با جابجایی مراحل نقشه ذخیره‌شده پاک نشود
        if (formInitializedRef.current) return;
        formInitializedRef.current = true;
        baselineSnapshotRef.current = null;
        setFormData(emptyMyEventFormValues);
        setSlugTouched(false);
        setStartPickerValue(null);
        setEndPickerValue(null);
        setImageFile(null);
        setImagePreview(null);
        setCurrentStep(1);
        setFormError(null);
        setStudioOpen(false);
        return;
      }

      formInitializedRef.current = true;
      const days = normalizeEventDays(initialValues.days ?? []);
      const nextValues: MyEventEventFormValues = {
        ...emptyMyEventFormValues,
        ...initialValues,
        days,
        seatingLayout: initialValues.seatingLayout ?? null,
        publishOnMyEvent: initialValues.publishOnMyEvent ?? true,
      };
      baselineSnapshotRef.current = serializeFormSnapshot(nextValues);
      setFormData(nextValues);
      setSlugTouched(Boolean(initialValues.publicEventSlug));
      setImageFile(null);
      setImagePreview(null);
      setCurrentStep(1);
      setFormError(null);
      setStudioOpen(false);

      if (days.length > 0) {
        setStartPickerValue(toPersianPickerDate(days[0].date));
        setEndPickerValue(toPersianPickerDate(days[days.length - 1].date));
      } else {
        setStartPickerValue(null);
        setEndPickerValue(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [initialValues]);

  useEffect(() => {
    if (!startPickerValue || !endPickerValue) return;

    const start = new DateObject(startPickerValue).toDate();
    const end = new DateObject(endPickerValue).toDate();
    if (start > end) return;

    const timer = setTimeout(() => {
      setFormData((prev) => {
      const generatedDays: EventDay[] = [];
      const current = new Date(start);

      while (current <= end) {
        const dateObj = new DateObject({ date: current, calendar: persian });
        const date = normalizeDateString(dateObj.format("YYYY/MM/DD"));
        const existingDay = prev.days.find(
          (day) => normalizeDateString(day.date) === date
        );

        generatedDays.push({
          date,
          sessions: existingDay?.sessions.length
            ? existingDay.sessions.map((session) => ({
                time: normalizeTimeString(session.time),
                purchaseUrl: session.purchaseUrl ?? "",
              }))
            : [{ time: "20:00", purchaseUrl: "" }],
        });

        current.setDate(current.getDate() + 1);
      }

      return { ...prev, days: generatedDays };
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [startPickerValue, endPickerValue]);

  const handleImageSelect = async (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageProcessing(true);
    try {
      const processed = await processEventImageFile(file);
      setImageFile(processed);
      setImagePreview(URL.createObjectURL(processed));
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در پردازش تصویر");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageProcessing(false);
    }
  };

  const addSession = (dayIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].sessions.push({ time: "21:00", purchaseUrl: "" });
    setFormData({ ...formData, days: newDays });
  };

  const removeDay = (dayIndex: number) => {
    setFormData({
      ...formData,
      days: formData.days.filter((_, index) => index !== dayIndex),
    });
  };

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].sessions = newDays[dayIndex].sessions.filter(
      (_, index) => index !== sessionIndex
    );
    setFormData({ ...formData, days: newDays });
  };

  const updateSessionTime = (
    dayIndex: number,
    sessionIndex: number,
    time: string
  ) => {
    const newDays = [...formData.days];
    newDays[dayIndex].sessions[sessionIndex].time = normalizeTimeString(time);
    setFormData({ ...formData, days: newDays });
  };

  const applySessionsToAllDays = (sourceDayIndex: number) => {
    const template = formData.days[sourceDayIndex]?.sessions;
    if (!template?.length) return;

    setFormData((prev) => ({
      ...prev,
      days: prev.days.map((day) => ({
        ...day,
        sessions: template.map((session) => ({
          time: session.time,
          purchaseUrl: session.purchaseUrl ?? "",
        })),
      })),
    }));
  };

  const focusField = (field: FormFieldKey) => {
    requestAnimationFrame(() => {
      const target = fieldRefs.current[field];
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        target.focus({ preventScroll: true });
      } else {
        target?.querySelector<HTMLElement>("input, textarea, button")?.focus({
          preventScroll: true,
        });
      }
    });
  };

  const scrollWizardToTop = () => {
    requestAnimationFrame(() => {
      wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const validateStep = (step: number): FormValidationError | null => {
    if (step === 1) {
      if (!formData.title.trim()) {
        return { field: "title", message: "لطفاً نام رویداد را وارد نمایید." };
      }
      if (!normalizePublicEventSlug(formData.publicEventSlug)) {
        return {
          field: "publicEventSlug",
          message: "لطفاً نام انگلیسی لینک رویداد را وارد کنید (مثلاً asrhajar).",
        };
      }
    }

    if (step === 2) {
      if (!formData.city.trim()) {
        return { field: "city", message: "لطفاً شهر برگزاری را انتخاب کنید." };
      }
      if (!formData.place.trim()) {
        return { field: "place", message: "لطفاً مکان برگزاری را وارد نمایید." };
      }
      if (formData.venueTemplateId == null && !formData.placeAddress.trim()) {
        return {
          field: "placeAddress",
          message: "برای محل اجرای سفارشی، لطفاً آدرس دقیق را وارد کنید.",
        };
      }
    }

    if (step === 3) {
      const hasImage =
        Boolean(imageFile) ||
        hasUploadedImage(formData.image) ||
        Boolean(formData.image.trim());
      if (!hasImage || (!isEdit && !imageFile && !hasUploadedImage(formData.image))) {
        return { field: "image", message: "لطفاً تصویر رویداد را آپلود کنید." };
      }
    }

    if (step === 4) {
      if (!startPickerValue || !endPickerValue) {
        return {
          field: "dates",
          message: "لطفاً بازه تاریخ برگزاری رویداد را مشخص کنید.",
        };
      }
      if (formData.days.length === 0) {
        return {
          field: "dates",
          message: "لطفاً بازه تاریخ و حداقل یک سانس برای رویداد تعریف کنید.",
        };
      }
      if (!formData.days.some((day) => day.sessions.length > 0)) {
        return {
          field: "dates",
          message: "لطفاً حداقل یک سانس برای رویداد تعریف کنید.",
        };
      }
    }

    if (step === 5) {
      const pricingError = validateMyEventPricing({
        hasAssignedSeating: formData.hasAssignedSeating,
        pricingMode: formData.pricingMode,
        fixedPriceAmount: formData.fixedPriceAmount,
      });
      if (!pricingError) return null;

      if (formData.hasAssignedSeating === null) {
        return { field: "hasAssignedSeating", message: pricingError };
      }
      if (formData.hasAssignedSeating === false && !formData.pricingMode) {
        return { field: "pricingMode", message: pricingError };
      }
      if (formData.pricingMode === "fixed" && !formData.fixedPriceAmount.trim()) {
        return { field: "fixedPriceAmount", message: pricingError };
      }
      return { field: "hasAssignedSeating", message: pricingError };
    }

    if (step === 6) {
      const publishOnMyEvent = formData.publishOnMyEvent !== false;
      const listOnBilitmall = formData.listOnBilitmall === true;
      if (!publishOnMyEvent && !listOnBilitmall) {
        return {
          field: "publishChannels",
          message: "حداقل یکی از کانال‌های انتشار را انتخاب کنید.",
        };
      }
    }

    return null;
  };

  const validateForm = (): FormValidationError | null => {
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      const error = validateStep(step);
      if (error) return error;
    }
    return null;
  };

  const goToStep = (step: number) => {
    if (step < 1 || step > TOTAL_STEPS || step > currentStep) return;
    closeWizardOverlays();
    setFormError(null);
    scheduleWizardStepChange(() => {
      setCurrentStep(step);
      scrollWizardToTop();
    });
  };

  const goBack = () => {
    if (currentStep <= 1) return;
    closeWizardOverlays();
    setFormError(null);
    const prevStep = currentStep - 1;
    scheduleWizardStepChange(() => {
      setCurrentStep(prevStep);
      scrollWizardToTop();
    });
  };

  const goNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setFormError(validationError);
      focusField(validationError.field);
      formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    closeWizardOverlays();
    setFormError(null);
    const nextStep = Math.min(currentStep + 1, TOTAL_STEPS);
    scheduleWizardStepChange(() => {
      setCurrentStep(nextStep);
      scrollWizardToTop();
    });
  };

  const isDirty =
    !isEdit ||
    imageFile != null ||
    (baselineSnapshotRef.current != null &&
      serializeFormSnapshot(formData) !== baselineSnapshotRef.current);
  const canSubmit = !isEdit || isDirty;
  const finalSubmitLabel = isEdit
    ? canSubmit
      ? "تغییر و ثبت"
      : "تغییری انجام نشده"
    : submitLabel;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Enter در مراحل قبلی فقط جلو می‌برد؛ ثبت فقط با کلیک دکمه در مرحله آخر
    if (currentStep < TOTAL_STEPS) {
      goNext();
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      closeWizardOverlays();
      setFormError(validationError);
      const targetStep =
        validationError.field === "title" || validationError.field === "publicEventSlug"
          ? 1
          : validationError.field === "city" ||
              validationError.field === "place" ||
              validationError.field === "placeAddress"
            ? 2
            : validationError.field === "image"
              ? 3
              : validationError.field === "dates"
                ? 4
                : validationError.field === "publishChannels"
                  ? 6
                  : validationError.field === "description"
                    ? 7
                    : 5;
      setCurrentStep(targetStep);
      focusField(validationError.field);
      formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (isEdit && !isDirty) {
      setFormError({
        field: "description",
        message: "تغییری برای ثبت وجود ندارد.",
      });
      return;
    }

    setFormError(null);

    const result = await onSubmit(
      {
        ...formData,
        publicEventSlug: normalizePublicEventSlug(formData.publicEventSlug),
        days: normalizeEventDays(formData.days),
        seatingLayout:
          formData.hasAssignedSeating === true && formData.venueTemplateId == null
            ? formData.seatingLayout ?? null
            : null,
      },
      imageFile
    );

    if (isEdit) {
      const savedImage = result?.image?.trim() || formData.image;
      const saved: MyEventEventFormValues = {
        ...formData,
        image: savedImage,
      };
      baselineSnapshotRef.current = serializeFormSnapshot(saved);
      setFormData(saved);
      setImageFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    }
  };

  const submitForm = () => {
    void handleSubmit();
  };

  const linkPreview = formatMyEventEventLinkPreview(
    organizerSlug,
    formData.publicEventSlug || buildPublicEventSlug(formData.title) || "eventname"
  );

  const examples = formData.category ? getCategoryExamples(formData.category) : null;

  if (!formData.category) {
    return (
      <div className="max-w-2xl space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">نوع رویداد چیست؟</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-slate-400">
            ابتدا دسته را انتخاب کنید تا نمونه‌های مناسب در فرم پیشنهاد شود.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {MY_EVENT_CATEGORIES.map((cat) => {
            const ex = getCategoryExamples(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setFormError(null);
                  setFormData({ ...emptyMyEventFormValues, category: cat });
                }}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-right transition hover:border-brand-500/50 hover:bg-brand-500/5 dark:border-white/10 dark:bg-slate-900"
              >
                <p className="text-lg font-black text-brand-600 dark:text-brand-400">{cat}</p>
                {ex ? (
                  <p className="mt-2 text-xs leading-6 text-neutral-400 dark:text-slate-500">
                    مثال: {ex.title}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const previewImageUrl =
    imagePreview ?? (hasUploadedImage(formData.image) ? formData.image : "");

  const usesLinkedVenue =
    formData.hasAssignedSeating === true && formData.venueTemplateId != null;

  async function openLinkedVenuePreview() {
    if (!formData.venueTemplateId) return;

    if (eventId) {
      window.location.href = `/my-event/events/${eventId}/seating`;
      return;
    }

    setVenuePreviewLoading(true);
    try {
      const res = await fetch(`/api/my-event/venue-templates/${formData.venueTemplateId}`);
      const data = (await res.json()) as {
        error?: string;
        name?: string;
        layout?: SeatingLayout;
      };
      if (!res.ok || !data.layout) {
        alert(data.error ?? "خطا در بارگذاری صحنه سالن");
        return;
      }
      setVenuePreview({
        name: data.name ?? formData.place,
        layout: data.layout,
      });
    } catch {
      alert("خطا در بارگذاری صحنه سالن");
    } finally {
      setVenuePreviewLoading(false);
    }
  }

  function openCustomSeatingStudio() {
    if (eventId) {
      window.location.href = `/my-event/events/${eventId}/seating`;
      return;
    }

    const venueName = formData.place.trim() || formData.title.trim() || "محل اجرا";
    setFormData((prev) => ({
      ...prev,
      seatingLayout: prev.seatingLayout
        ? normalizeLayout({
            ...prev.seatingLayout,
            name: venueName,
          })
        : createEmptyLayout(venueName),
    }));
    setStudioOpen(true);
  }

  const draftSeatingLayout = formData.seatingLayout ?? null;
  const draftHasSeatingPlan =
    draftSeatingLayout != null && countBookableSeats(draftSeatingLayout) > 0;
  const showSeatingDesigned = eventId ? hasSeatingPlan : draftHasSeatingPlan;

  function setPublishOnMyEvent(checked: boolean) {
    clearFieldError("publishChannels");
    setFormData((prev) => {
      if (!checked && !prev.listOnBilitmall) return prev;
      return { ...prev, publishOnMyEvent: checked };
    });
  }

  function setListOnBilitmall(checked: boolean) {
    clearFieldError("publishChannels");
    setFormData((prev) => {
      const publishOnMyEvent = prev.publishOnMyEvent !== false;
      if (!checked && !publishOnMyEvent) return prev;
      return { ...prev, listOnBilitmall: checked };
    });
  }

  return (
    <form
      noValidate
      translate="no"
      onSubmit={(e) => {
        e.preventDefault();
        // Enter فقط مرحله بعد می‌رود؛ ثبت نهایی فقط با کلیک دکمه
        if (currentStep < TOTAL_STEPS) goNext();
      }}
      className="mx-auto max-w-2xl space-y-5 overflow-visible"
    >
      <div ref={wizardTopRef} className="space-y-5">
        <WizardProgress currentStep={currentStep} onGoToStep={goToStep} />

        {formError ? (
          <div
            ref={formErrorRef}
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm shadow-sm dark:border-red-500/30 dark:bg-red-500/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
              <CircleAlert className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-black text-red-700 dark:text-red-200">
                برای ادامه این مورد را تکمیل کنید
              </p>
              <p className="mt-1 leading-6 text-red-600 dark:text-red-300">
                {activeFieldMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20"
              aria-label="بستن پیام خطا"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/10 px-4 py-3">
          <div>
            <p className="text-xs text-brand-700 dark:text-brand-300">
              <span>دسته انتخاب‌شده</span>
            </p>
            <p className="font-black text-neutral-900 dark:text-white">
              <span>{formData.category}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setCurrentStep(1);
              setFormData({ ...emptyMyEventFormValues });
            }}
            className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white"
          >
            <span>تغییر دسته</span>
          </button>
        </div>
      </div>

      <div key={`wizard-step-panel-${currentStep}`} className="min-h-40">
      {currentStep === 1 ? (
      <FormSection
        step={1}
        title="اطلاعات اصلی رویداد"
        description="نام و لینک صفحه اختصاصی رویداد را مشخص کنید."
        icon={<Sparkles className="h-4 w-4" />}
        accent="emerald"
      >
        <div>
          <label className={labelClass}>نام رویداد</label>
          {examples?.titleHint ? (
            <p className="mb-2 text-xs text-neutral-400 dark:text-slate-500">{examples.titleHint}</p>
          ) : null}
          <input
            ref={setFieldRef("title")}
            type="text"
            value={formData.title}
            placeholder={examples?.title ?? "عنوان رویداد"}
            onChange={(e) => {
              const title = e.target.value;
              clearFieldError("title");
              setFormData((prev) => ({
                ...prev,
                title,
                publicEventSlug: slugTouched
                  ? prev.publicEventSlug
                  : buildPublicEventSlug(title),
              }));
            }}
            className={cn(inputClass, fieldHasError("title") && inputErrorClass)}
            aria-invalid={fieldHasError("title")}
          />
          {fieldHasError("title") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
        </div>

        <div>
          <label className={labelClass}>
            نام انگلیسی لینک رویداد <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <p className="mb-2 text-xs text-neutral-400 dark:text-slate-500">
            فقط حروف کوچک انگلیسی، عدد و خط تیره. اگر خودکار درست نشد، خودتان بنویسید.
          </p>
          <input
            ref={setFieldRef("publicEventSlug")}
            type="text"
            dir="ltr"
            value={formData.publicEventSlug}
            placeholder={examples?.publicEventSlug ?? "asrhajar"}
            onChange={(e) => {
              setSlugTouched(true);
              clearFieldError("publicEventSlug");
              setFormData({
                ...formData,
                publicEventSlug: normalizePublicEventSlug(e.target.value),
              });
            }}
            className={cn(
              inputClass,
              "font-mono",
              fieldHasError("publicEventSlug") && inputErrorClass
            )}
            aria-invalid={fieldHasError("publicEventSlug")}
          />
          {fieldHasError("publicEventSlug") ? (
            <FieldHint>{activeFieldMessage}</FieldHint>
          ) : null}
          <div className="mt-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3">
            <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
              پیش‌نمایش لینک فروش (ساب‌دامین بلیت‌مال)
            </p>
            <p className="mt-1 font-mono text-sm text-neutral-900 dark:text-white" dir="ltr">
              {linkPreview}
            </p>
            <p className="mt-2 text-xs text-neutral-400 dark:text-slate-500">
              فعلاً روی لوکال:{" "}
              <span className="text-neutral-500 dark:text-slate-400">
                localhost:3000/sites/{organizerSlug}/
                {formData.publicEventSlug || "..."}
              </span>
            </p>
          </div>
        </div>
      </FormSection>
      ) : null}

      {currentStep === 2 ? (
      <FormSection
        step={2}
        title="مکان برگزاری"
        description="شهر، محل و در صورت نیاز آدرس دقیق رویداد را مشخص کنید."
        icon={<MapPin className="h-4 w-4" />}
        accent="sky"
        className="overflow-visible"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div ref={setFieldRef("city")}>
            <label className={labelClass}>شهر</label>
            <CityAutocomplete
              includeAllCities
              allowCreate
              active={currentStep === 2}
              value={formData.city}
              className={cn(
                "w-full rounded-xl border border-neutral-300 bg-white py-3 pr-10 pl-9 text-neutral-900 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-slate-900 dark:text-white",
                fieldHasError("city") && inputErrorClass
              )}
              onChange={(city) => {
                clearFieldError("city");
                clearFieldError("placeAddress");
                setFormData((prev) => ({
                  ...prev,
                  city,
                  venueTemplateId: null,
                  placeAddress: "",
                }));
              }}
            />
            {fieldHasError("city") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
          </div>
          <div ref={setFieldRef("place")}>
            <label className={labelClass}>مکان برگزاری</label>
            <VenuePlaceAutocomplete
              city={formData.city}
              value={formData.place}
              venueTemplateId={formData.venueTemplateId}
              placeAddress={formData.placeAddress}
              active={currentStep === 2}
              onChange={(place, venueTemplateId, placeAddress) => {
                clearFieldError("place");
                clearFieldError("placeAddress");
                setStudioOpen(false);
                setFormData((prev) => ({
                  ...prev,
                  place,
                  venueTemplateId,
                  placeAddress,
                  ...(venueTemplateId != null ? { seatingLayout: null } : {}),
                }));
              }}
              placeholder={examples?.place ?? "مکان برگزاری"}
              className={cn(inputClass, fieldHasError("place") && inputErrorClass)}
            />
            {fieldHasError("place") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
          </div>
        </div>

        {formData.place.trim() && formData.venueTemplateId == null ? (
          <div ref={setFieldRef("placeAddress")} className="mt-4">
            <label className={labelClass}>آدرس دقیق محل اجرا</label>
            <textarea
              value={formData.placeAddress}
              onChange={(e) => {
                clearFieldError("placeAddress");
                setFormData({ ...formData, placeAddress: e.target.value });
              }}
              rows={3}
              placeholder="مثال: خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲، طبقه همکف"
              className={cn(
                inputClass,
                "min-h-[5.5rem] resize-y",
                fieldHasError("placeAddress") && inputErrorClass
              )}
            />
            <p className="mt-1.5 text-xs leading-6 text-neutral-400 dark:text-slate-500">
              چون این محل در فهرست سالن‌های بلیت‌مال نیست، آدرس دقیق برای راهنمایی مهمانان الزامی
              است.
            </p>
            {fieldHasError("placeAddress") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
          </div>
        ) : null}
      </FormSection>
      ) : null}

      {currentStep === 3 ? (
      <FormSection
        step={3}
        title="تصویر رویداد"
        description="یک تصویر واضح برای کارت رویداد آپلود کنید."
        icon={<ImageIcon className="h-4 w-4" />}
        accent="rose"
      >
        <div
          ref={setFieldRef("image")}
          className={cn(
            "rounded-2xl border border-transparent p-1",
            fieldHasError("image") && "border-red-300 dark:border-red-500/50"
          )}
        >
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                clearFieldError("image");
                void handleImageSelect(e.target.files?.[0] ?? null);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageProcessing}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-700 transition hover:border-brand-500/50 disabled:opacity-60 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200"
            >
              <Upload className="h-4 w-4" />
              {imageProcessing ? "در حال پردازش تصویر..." : "آپلود از کامپیوتر"}
            </button>
            {imageFile ? (
              <button
                type="button"
                onClick={() => {
                  clearFieldError("image");
                  void handleImageSelect(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="inline-flex items-center gap-1 text-sm font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
                حذف فایل
              </button>
            ) : null}
          </div>
          <p className="text-xs leading-6 text-neutral-400 dark:text-slate-500">
            {EVENT_CARD_IMAGE_RECOMMENDED_TEXT}
          </p>
          {previewImageUrl ? (
            <EventImagePreviews
              variant="card"
              imageUrl={previewImageUrl}
              title={formData.title || "نام رویداد"}
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400 dark:bg-slate-900 dark:text-slate-500">
              تصویری انتخاب نشده
            </div>
          )}
          {fieldHasError("image") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
        </div>
      </FormSection>
      ) : null}

      {currentStep === 4 ? (
      <FormSection
        step={4}
        title="تاریخ و سانس‌ها"
        description="بازه برگزاری را مشخص کنید، سپس برای هر روز سانس تعیین کنید."
        icon={<CalendarDays className="h-4 w-4" />}
        accent="emerald"
        className="overflow-visible"
      >
        <div
          ref={setFieldRef("dates")}
          className={cn(
            "space-y-4 rounded-2xl border border-transparent p-1",
            fieldHasError("dates") && "border-red-300 dark:border-red-500/50"
          )}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <PersianDateField
              label="از تاریخ"
              value={startPickerValue}
              onChange={(date) => {
                clearFieldError("dates");
                setStartPickerValue(date);
              }}
              placeholder="انتخاب تاریخ شروع"
              hasError={fieldHasError("dates")}
              enabled={currentStep === 4}
            />
            <PersianDateField
              label="تا تاریخ"
              value={endPickerValue}
              onChange={(date) => {
                clearFieldError("dates");
                setEndPickerValue(date);
              }}
              placeholder="انتخاب تاریخ پایان"
              hasError={fieldHasError("dates")}
              enabled={currentStep === 4}
            />
          </div>
          <p className="text-xs leading-6 text-neutral-400 dark:text-slate-500">
            با کلیک روی فیلد، تقویم شمسی باز می‌شود و روزها به‌صورت خودکار ساخته می‌شوند.
          </p>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-white/10 dark:bg-slate-900/40 sm:p-4">
            <EventSessionScheduleEditor
              days={formData.days}
              onAddSession={addSession}
              onRemoveSession={removeSession}
              onRemoveDay={removeDay}
              onUpdateSessionTime={updateSessionTime}
              onApplySessionsToAllDays={applySessionsToAllDays}
            />
          </div>
          {fieldHasError("dates") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
        </div>
      </FormSection>
      ) : null}

      {currentStep === 5 ? (
      <FormSection
        step={5}
        title="صندلی و قیمت‌گذاری"
        description="جایگاه صندلی و مدل قیمت بلیت را مشخص کنید."
        icon={<Armchair className="h-4 w-4" />}
        accent="violet"
      >
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3.5 dark:border-violet-500/25 dark:bg-violet-500/10">
          <p className="text-[11px] font-bold text-violet-600 dark:text-violet-300">
            سالن انتخاب‌شده
          </p>
          <div className="mt-1.5 flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-500 dark:text-violet-300" />
            <div className="min-w-0">
              <p className="text-sm font-black text-neutral-900 dark:text-white">
                {formData.place.trim() || "هنوز سالنی انتخاب نشده"}
              </p>
              {formData.place.trim() ? (
                <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-slate-400">
                  {formData.venueTemplateId != null
                    ? "سالن تأییدشده بلیت‌مال"
                    : "محل اجرای اختصاصی (نیاز به طراحی صحنه)"}
                  {formData.city.trim() ? ` · ${formData.city}` : ""}
                  {formData.placeAddress.trim()
                    ? ` · ${formData.placeAddress.trim()}`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                  برای ادامه، از مرحله مکان یک سالن یا محل اجرا انتخاب کنید.
                </p>
              )}
            </div>
          </div>
        </div>

        <div ref={setFieldRef("hasAssignedSeating")}>
          <p className={labelClass}>آیا برای میهمانان جایگاه صندلی مشخص تعریف شود؟</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                clearFieldError("hasAssignedSeating");
                clearFieldError("pricingMode");
                clearFieldError("fixedPriceAmount");
                setFormData({
                  ...formData,
                  hasAssignedSeating: true,
                  pricingMode: "per_seat",
                  fixedPriceAmount: "",
                });
              }}
              className={cn(
                "rounded-2xl border px-4 py-3.5 text-sm font-bold transition",
                formData.hasAssignedSeating === true
                  ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-violet-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300",
                fieldHasError("hasAssignedSeating") &&
                  formData.hasAssignedSeating !== true &&
                  "border-red-300 dark:border-red-500/50"
              )}
            >
              بله، صندلی مشخص
            </button>
            <button
              type="button"
              onClick={() => {
                clearFieldError("hasAssignedSeating");
                clearFieldError("pricingMode");
                setStudioOpen(false);
                setFormData({
                  ...formData,
                  hasAssignedSeating: false,
                  seatingLayout: null,
                  pricingMode:
                    formData.pricingMode === "per_seat" ? null : formData.pricingMode,
                });
              }}
              className={cn(
                "rounded-2xl border px-4 py-3.5 text-sm font-bold transition",
                formData.hasAssignedSeating === false
                  ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                  : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-violet-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300",
                fieldHasError("hasAssignedSeating") &&
                  formData.hasAssignedSeating !== false &&
                  "border-red-300 dark:border-red-500/50"
              )}
            >
              خیر، بدون صندلی ثابت
            </button>
          </div>
          {fieldHasError("hasAssignedSeating") ? (
            <FieldHint>{activeFieldMessage}</FieldHint>
          ) : null}
        </div>

        {formData.hasAssignedSeating === false ? (
          <div ref={setFieldRef("pricingMode")} className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-sm font-bold text-neutral-700 dark:text-slate-300">
                قیمت‌گذاری بلیت
              </p>
              <div className="h-px min-w-4 flex-1 bg-neutral-200 dark:bg-white/10" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  clearFieldError("pricingMode");
                  clearFieldError("fixedPriceAmount");
                  setFormData({
                    ...formData,
                    pricingMode: "free",
                    fixedPriceAmount: "",
                  });
                }}
                className={cn(
                  "rounded-2xl border px-4 py-3.5 text-right transition",
                  formData.pricingMode === "free"
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-violet-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300",
                  fieldHasError("pricingMode") &&
                    formData.pricingMode !== "free" &&
                    "border-red-300 dark:border-red-500/50"
                )}
              >
                <p className="text-sm font-black">رایگان</p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-5",
                    formData.pricingMode === "free"
                      ? "text-white/80"
                      : "text-neutral-500 dark:text-slate-400"
                  )}
                >
                  ثبت‌نام یا ورود بدون پرداخت
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  clearFieldError("pricingMode");
                  setFormData({
                    ...formData,
                    pricingMode: "fixed",
                  });
                }}
                className={cn(
                  "rounded-2xl border px-4 py-3.5 text-right transition",
                  formData.pricingMode === "fixed"
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-violet-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300",
                  fieldHasError("pricingMode") &&
                    formData.pricingMode !== "fixed" &&
                    "border-red-300 dark:border-red-500/50"
                )}
              >
                <p className="text-sm font-black">قیمت ثابت</p>
                <p
                  className={cn(
                    "mt-1 text-xs leading-5",
                    formData.pricingMode === "fixed"
                      ? "text-white/80"
                      : "text-neutral-500 dark:text-slate-400"
                  )}
                >
                  یک مبلغ واحد برای هر بلیت
                </p>
              </button>
            </div>
            {fieldHasError("pricingMode") ? (
              <FieldHint>{activeFieldMessage}</FieldHint>
            ) : null}

            {formData.pricingMode === "fixed" ? (
              <div ref={setFieldRef("fixedPriceAmount")}>
                <label htmlFor="my-event-fixed-price" className={labelClass}>
                  مبلغ هر بلیت
                </label>
                <input
                  id="my-event-fixed-price"
                  type="text"
                  inputMode="numeric"
                  value={formData.fixedPriceAmount}
                  placeholder="مثلاً: ۳۵۰٬۰۰۰ تومان"
                  onChange={(e) => {
                    clearFieldError("fixedPriceAmount");
                    setFormData({ ...formData, fixedPriceAmount: e.target.value });
                  }}
                  className={cn(inputClass, fieldHasError("fixedPriceAmount") && inputErrorClass)}
                />
                {fieldHasError("fixedPriceAmount") ? (
                  <FieldHint>{activeFieldMessage}</FieldHint>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {formData.hasAssignedSeating === true && usesLinkedVenue ? (
          <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <p className="text-sm leading-7 text-brand-700 dark:text-brand-200">
              {MY_EVENT_LINKED_VENUE_SEATING_HINT}
            </p>
            <button
              type="button"
              disabled={venuePreviewLoading}
              onClick={() => void openLinkedVenuePreview()}
              className="inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-60"
            >
              {venuePreviewLoading
                ? "در حال بارگذاری..."
                : MY_EVENT_VIEW_LINKED_VENUE_CTA(formData.place || "رویداد")}
            </button>
          </div>
        ) : null}

        {formData.hasAssignedSeating === true && !usesLinkedVenue ? (
          <div className="space-y-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            {showSeatingDesigned ? (
              <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
                ✓ صحنه و نقشه صندلی‌ها تعریف شده است.
              </p>
            ) : (
              <p className="text-sm leading-7 text-violet-700 dark:text-violet-200">
                {MY_EVENT_SEATING_DESIGN_HINT}
              </p>
            )}
            {eventId ? (
              <Link
                href={`/my-event/events/${eventId}/seating`}
                className="inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-500"
              >
                {showSeatingDesigned
                  ? "ویرایش صحنه و قیمت‌گذاری"
                  : "ورود به استودیو طراحی محل اجرا"}
              </Link>
            ) : (
              <button
                type="button"
                onClick={openCustomSeatingStudio}
                className="inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-500"
              >
                {showSeatingDesigned
                  ? "ویرایش صحنه و قیمت‌گذاری"
                  : MY_EVENT_DESIGN_SEATING_CTA}
              </button>
            )}
          </div>
        ) : null}

      </FormSection>
      ) : null}

      {currentStep === 6 ? (
      <FormSection
        step={6}
        title="کانال‌های انتشار"
        description="می‌توانید هر دو را با هم انتخاب کنید."
        icon={<Megaphone className="h-4 w-4" />}
        accent="amber"
      >
        <div ref={setFieldRef("publishChannels")} className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 hover:border-brand-400/60 dark:border-white/10 dark:bg-slate-900 dark:hover:border-brand-500/40">
            <input
              type="checkbox"
              checked={formData.publishOnMyEvent !== false}
              onChange={(e) => setPublishOnMyEvent(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            <span className="text-sm font-bold text-neutral-700 dark:text-slate-200">
              صفحه اختصاصی My Event
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 hover:border-amber-400/60 dark:border-white/10 dark:bg-slate-900 dark:hover:border-amber-500/40">
            <input
              type="checkbox"
              checked={formData.listOnBilitmall}
              onChange={(e) => setListOnBilitmall(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            <span className="text-sm font-bold text-neutral-700 dark:text-slate-200">
              انتشار در سایت بلیت‌مال
            </span>
          </label>
          {fieldHasError("publishChannels") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
        </div>
      </FormSection>
      ) : null}

      {currentStep === 7 ? (
      <FormSection
        step={7}
        title="توضیحات"
        description="در صورت تمایل توضیحات رویداد را بنویسید، سپس دکمه ثبت را بزنید تا برای تأیید ادمین ارسال شود."
        icon={<FileText className="h-4 w-4" />}
        accent="sky"
      >
        <div ref={setFieldRef("description")}>
          <label className={labelClass}>توضیحات رویداد (اختیاری)</label>
          <textarea
            value={formData.description}
            onChange={(e) => {
              clearFieldError("description");
              setFormData((prev) => ({ ...prev, description: e.target.value }));
            }}
            rows={4}
            placeholder={examples?.description ?? "توضیحات رویداد"}
            className={cn(inputClass, fieldHasError("description") && inputErrorClass)}
          />
          {fieldHasError("description") ? <FieldHint>{activeFieldMessage}</FieldHint> : null}
        </div>
      </FormSection>
      ) : null}
      </div>

      {venuePreview ? (
        <SeatingStudio
          layout={venuePreview.layout}
          onChange={() => {}}
          onSave={() => setVenuePreview(null)}
          onClose={() => setVenuePreview(null)}
          readOnly
        />
      ) : null}

      {studioOpen && draftSeatingLayout ? (
        <SeatingStudio
          layout={draftSeatingLayout}
          onChange={(layout) =>
            setFormData((prev) => ({ ...prev, seatingLayout: layout }))
          }
          onSave={() => setStudioOpen(false)}
          onClose={() => setStudioOpen(false)}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
        {currentStep < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 font-black text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 sm:flex-1"
          >
            <span>مرحله بعد</span>
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={submitForm}
            disabled={loading || !canSubmit}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-600 py-3.5 font-black text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
          >
            <span>{loading ? "در حال ذخیره..." : finalSubmitLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={goBack}
          disabled={currentStep <= 1}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white py-3.5 font-bold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5 sm:w-40"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          <span>مرحله قبل</span>
        </button>
      </div>
    </form>
  );
}
