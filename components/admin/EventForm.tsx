"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Upload, X } from "lucide-react";
import CityAutocomplete from "@/components/CityAutocomplete";
import {
  ADMIN_EVENT_STATUSES,
  EVENT_CATEGORIES,
  type EventDay,
  type EventFormData,
  type EventItem,
} from "@/lib/events/types";
import { getEventSchedule, formatPersianDateShort, hasScheduleGaps, isEventEnded, normalizeDateString, normalizeEventDays, normalizeTimeString } from "@/lib/events/date-utils";
import { hasUploadedImage } from "@/lib/events/helpers";
import {
  EVENT_BANNER_IMAGE_RECOMMENDED_TEXT,
  EVENT_CARD_IMAGE_RECOMMENDED_TEXT,
} from "@/lib/events/image-specs";
import { processEventBannerImageFile, processEventImageFile } from "@/lib/events/process-event-image";
import EventImagePreviews from "@/components/admin/EventImagePreviews";
import EventImportPanel from "@/components/admin/EventImportPanel";
import EventTicketingSetup from "@/components/admin/EventTicketingSetup";
import VenuePlaceAutocomplete from "@/components/venues/VenuePlaceAutocomplete";
import {
  EVENT_PRICE_EXTERNAL_LABEL,
  eventToFormTicketingFields,
  isExternalTicketing,
  isInternalTicketing,
  isTicketingSetupComplete,
  resolveFormPrice,
  validateEventFormBusinessRules,
} from "@/lib/events/pricing";

const emptyForm = (): EventFormData => ({
  title: "",
  city: "",
  category: "کنسرت",
  place: "",
  placeAddress: "",
  venueTemplateId: null,
  price: "",
  image: "",
  bannerImage: "",
  badge: "",
  days: [],
  published: true,
  popular: false,
  featured: false,
  status: "active",
  ticketingType: null,
  hasAssignedSeating: null,
  pricingMode: null,
  fixedPriceAmount: "",
});

type EventFormProps = {
  initialEvent?: EventItem | null;
  initialImportUrl?: string;
  onSubmit: (
    data: EventFormData,
    imageFile: File | null,
    bannerImageFile: File | null
  ) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  showImport?: boolean;
};

export default function EventForm({
  initialEvent,
  initialImportUrl,
  onSubmit,
  onCancel,
  submitting = false,
  showImport = !initialEvent,
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>(emptyForm);
  const [startPickerValue, setStartPickerValue] = useState<DateObject | null>(null);
  const [endPickerValue, setEndPickerValue] = useState<DateObject | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [bannerImageProcessing, setBannerImageProcessing] = useState(false);
  const [ticketingSetupComplete, setTicketingSetupComplete] = useState(Boolean(initialEvent));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const skipScheduleRangeFillRef = useRef(false);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
    };
  }, [imagePreview, bannerImagePreview]);

  useEffect(() => {
    if (!initialEvent) {
      setFormData(emptyForm());
      setTicketingSetupComplete(false);
      setStartPickerValue(null);
      setEndPickerValue(null);
      setImageFile(null);
      setImagePreview(null);
      setBannerImageFile(null);
      setBannerImagePreview(null);
      return;
    }

    const schedule = getEventSchedule(initialEvent);
    const ticketingFields = eventToFormTicketingFields(initialEvent);
    setFormData({
      title: initialEvent.title,
      city: initialEvent.city,
      category: initialEvent.category,
      place: initialEvent.place,
      placeAddress: initialEvent.placeAddress ?? "",
      venueTemplateId: initialEvent.venueTemplateId ?? null,
      image: initialEvent.image,
      bannerImage: initialEvent.bannerImage ?? "",
      badge: initialEvent.badge ?? "",
      days: schedule,
      published: initialEvent.published !== false,
      popular: initialEvent.popular === true,
      featured: initialEvent.featured === true,
      status:
        initialEvent.status === "held" || initialEvent.status === "draft"
          ? "active"
          : (initialEvent.status ?? "active"),
      ...ticketingFields,
    });
    setTicketingSetupComplete(true);
    setImageFile(null);
    setImagePreview(null);
    setBannerImageFile(null);
    setBannerImagePreview(null);

    if (schedule.length > 0) {
      const firstDate = new DateObject({
        date: normalizeDateString(schedule[0].date),
        format: "YYYY/MM/DD",
        calendar: persian,
      });
      const lastDate = new DateObject({
        date: normalizeDateString(schedule[schedule.length - 1].date),
        format: "YYYY/MM/DD",
        calendar: persian,
      });
      setStartPickerValue(firstDate);
      setEndPickerValue(lastDate);
      if (hasScheduleGaps(schedule)) {
        skipScheduleRangeFillRef.current = true;
      }
    }
  }, [initialEvent]);

  useEffect(() => {
    if (initialEvent || !initialImportUrl?.trim()) return;
    setFormData((prev) => ({
      ...prev,
      ticketingType: "EXTERNAL_LINK",
      hasAssignedSeating: false,
      pricingMode: null,
      fixedPriceAmount: "",
      price: EVENT_PRICE_EXTERNAL_LABEL,
      category: prev.category || "کنسرت",
    }));
    setTicketingSetupComplete(true);
  }, [initialEvent, initialImportUrl]);

  useEffect(() => {
    if (!startPickerValue || !endPickerValue) return;
    if (skipScheduleRangeFillRef.current) {
      skipScheduleRangeFillRef.current = false;
      return;
    }

    const start = new DateObject(startPickerValue).toDate();
    const end = new DateObject(endPickerValue).toDate();
    if (start > end) return;

    setFormData((prev) => {
      const generatedDays: EventDay[] = [];
      const current = new Date(start);

      while (current <= end) {
        const dateObj = new DateObject({
          date: current,
          calendar: persian,
        });
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

  const handleBannerImageSelect = async (file: File | null) => {
    if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);

    if (!file) {
      setBannerImageFile(null);
      setBannerImagePreview(null);
      return;
    }

    setBannerImageProcessing(true);

    try {
      const processed = await processEventBannerImageFile(file);
      setBannerImageFile(processed);
      setBannerImagePreview(URL.createObjectURL(processed));
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در پردازش تصویر بنر");
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    } finally {
      setBannerImageProcessing(false);
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

  const updateSessionPurchaseUrl = (
    dayIndex: number,
    sessionIndex: number,
    purchaseUrl: string
  ) => {
    const newDays = [...formData.days];
    newDays[dayIndex].sessions[sessionIndex].purchaseUrl = purchaseUrl;
    setFormData({ ...formData, days: newDays });
  };

  function applyImportedDraft(draft: EventFormData) {
    const normalizedDays = normalizeEventDays(draft.days);
    skipScheduleRangeFillRef.current = true;
    setFormData({
      ...emptyForm(),
      ...draft,
      days: normalizedDays,
      bannerImage: draft.bannerImage ?? "",
      ticketingType: draft.ticketingType ?? "EXTERNAL_LINK",
      hasAssignedSeating: draft.hasAssignedSeating ?? false,
      pricingMode: draft.pricingMode ?? null,
      fixedPriceAmount: draft.fixedPriceAmount ?? "",
    });
    setTicketingSetupComplete(true);
    setImageFile(null);
    setImagePreview(null);
    setBannerImageFile(null);
    setBannerImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";

    if (normalizedDays.length > 0) {
      const firstDate = new DateObject({
        date: normalizeDateString(normalizedDays[0].date),
        format: "YYYY/MM/DD",
        calendar: persian,
      });
      const lastDate = new DateObject({
        date: normalizeDateString(normalizedDays[normalizedDays.length - 1].date),
        format: "YYYY/MM/DD",
        calendar: persian,
      });
      setStartPickerValue(firstDate);
      setEndPickerValue(lastDate);
    } else {
      setStartPickerValue(null);
      setEndPickerValue(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile && !hasUploadedImage(formData.image) && !formData.image.trim()) {
      alert("آپلود تصویر کارت رویداد الزامی است.");
      return;
    }

    if (!initialEvent && !imageFile && !hasUploadedImage(formData.image)) {
      alert("برای رویداد جدید، آپلود تصویر کارت الزامی است.");
      return;
    }

    if (
      formData.featured &&
      !bannerImageFile &&
      !hasUploadedImage(formData.bannerImage) &&
      !formData.bannerImage.trim()
    ) {
      alert("برای نمایش در پیشنهاد ویژه، آپلود تصویر بنر الزامی است.");
      return;
    }

    const businessError = validateEventFormBusinessRules(formData);
    if (businessError) {
      alert(businessError);
      return;
    }

    if (!ticketingSetupComplete || !isTicketingSetupComplete(formData)) {
      alert("تنظیمات فروش بلیت را کامل کنید.");
      return;
    }

    await onSubmit(
      { ...formData, price: resolveFormPrice(formData) },
      imageFile,
      bannerImageFile
    );
  };

  const showMainForm = ticketingSetupComplete && isTicketingSetupComplete(formData);
  const isExternal = isExternalTicketing(formData.ticketingType);
  const isInternal = isInternalTicketing(formData.ticketingType);

  const previewImageUrl =
    imagePreview ?? (hasUploadedImage(formData.image) ? formData.image : "");

  const previewBannerImageUrl =
    bannerImagePreview ??
    (hasUploadedImage(formData.bannerImage) ? formData.bannerImage : "");

  const isPastDate = useMemo(() => {
    if (formData.days.length === 0) return false;
    return isEventEnded({ date: "", time: "", days: formData.days });
  }, [formData.days]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <EventTicketingSetup
        formData={formData}
        onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        setupComplete={ticketingSetupComplete}
        onSetupComplete={() => setTicketingSetupComplete(true)}
        onEditSetup={() => setTicketingSetupComplete(false)}
        isEdit={Boolean(initialEvent)}
        eventId={initialEvent?.id}
      />

      {showMainForm ? (
        <>
      {showImport && isExternal ? (
        <EventImportPanel onApply={applyImportedDraft} initialImportUrl={initialImportUrl} />
      ) : null}
      {isPastDate ? (
        <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span className="font-bold">تاریخ گذشته</span>
          <span className="mr-2">—</span>
          این رویداد در سایت عمومی (بنر، لیست‌ها و جستجو) نمایش داده نمی‌شود.
        </div>
      ) : null}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          نام رویداد
        </label>
        <input
          type="text"
          required
          value={formData.title}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          placeholder="مثلاً: کنسرت همایون شجریان"
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            شهر
          </label>
          <CityAutocomplete
            includeAllCities
            required
            value={formData.city}
            onChange={(city) =>
              setFormData({
                ...formData,
                city,
                venueTemplateId: null,
                placeAddress: "",
              })
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            دسته‌بندی
          </label>
          {isInternal && formData.category ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {formData.category}
            </p>
          ) : (
            <select
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {EVENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
          {isExternal ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              برای هر سانس لینک خرید از سایت فروشنده را در بخش زمان‌بندی وارد کنید.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            محل برگزاری
          </label>
          <VenuePlaceAutocomplete
            variant="admin"
            city={formData.city}
            value={formData.place}
            venueTemplateId={formData.venueTemplateId ?? null}
            placeAddress={formData.placeAddress ?? ""}
            showLinkedAddress={false}
            onChange={(place, venueTemplateId, placeAddress) =>
              setFormData({ ...formData, place, venueTemplateId, placeAddress })
            }
            placeholder="مثلاً: سالن میلاد"
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            نشانی
          </label>
          <textarea
            rows={3}
            value={formData.placeAddress ?? ""}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="نشانی محل برگزاری را وارد کنید"
            onChange={(e) => setFormData({ ...formData, placeAddress: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            برچسب (اختیاری)
          </label>
          <input
            type="text"
            value={formData.badge}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="مثلاً: پرفروش"
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            وضعیت
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as EventFormData["status"],
              })
            }
          >
            {ADMIN_EVENT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          تصویر کارت رویداد <span className="text-red-500">*</span>
        </label>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageProcessing}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-700"
          >
            <Upload className="h-4 w-4" />
            {imageProcessing ? "در حال پردازش تصویر..." : "آپلود تصویر کارت"}
          </button>
          {imageFile ? (
            <button
              type="button"
              onClick={() => {
                handleImageSelect(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              حذف فایل انتخاب‌شده
            </button>
          ) : null}
          {imageFile ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">{imageFile.name}</span>
          ) : null}
        </div>

        <p className="mb-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
          {EVENT_CARD_IMAGE_RECOMMENDED_TEXT}
        </p>

        {previewImageUrl ? (
          <EventImagePreviews
            variant="card"
            imageUrl={previewImageUrl}
            title={formData.title || "نام رویداد"}
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            تصویری انتخاب نشده
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            از تاریخ
          </label>
          <div className="rounded-xl border border-slate-200 p-2 focus-within:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:[&_input]:text-slate-100">
            <DatePicker
              value={startPickerValue}
              onChange={(date) => setStartPickerValue(date as DateObject)}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              format="YYYY/MM/DD"
              inputClass="w-full outline-none p-2 bg-transparent"
              placeholder="انتخاب تاریخ شروع"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            تا تاریخ
          </label>
          <div className="rounded-xl border border-slate-200 p-2 focus-within:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:[&_input]:text-slate-100">
            <DatePicker
              value={endPickerValue}
              onChange={(date) => setEndPickerValue(date as DateObject)}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              format="YYYY/MM/DD"
              inputClass="w-full outline-none p-2 bg-transparent"
              placeholder="انتخاب تاریخ پایان"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            زمان‌بندی سانس‌ها
          </h2>
          {formData.days.length > 0 ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {formData.days.length.toLocaleString("fa-IR")} روز ·{" "}
              {formData.days
                .reduce((n, d) => n + d.sessions.length, 0)
                .toLocaleString("fa-IR")}{" "}
              سانس
            </span>
          ) : null}
        </div>

        {formData.days.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ابتدا بازه تاریخ را از تقویم شمسی انتخاب کن.
          </p>
        )}

        {formData.days.length > 0 ? (
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto rounded-xl pr-1">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {formData.days.map((day, dayIndex) => (
                <div
                  key={day.date}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="mb-2 flex items-start gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        تاریخ
                      </p>
                      <p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">
                        {formatPersianDateShort(day.date)}
                      </p>
                      <p className="text-[10px] text-slate-400" dir="ltr">
                        {day.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addSession(dayIndex)}
                      className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      + سانس
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDay(dayIndex)}
                      className="shrink-0 rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      title="حذف این روز"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {day.sessions.map((session, sessionIndex) => (
                      <div
                        key={`${day.date}-${sessionIndex}`}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 shrink-0 text-center text-[10px] font-bold text-slate-500">
                            {sessionIndex + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="20:00"
                            className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-center text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            value={session.time}
                            onChange={(e) =>
                              updateSessionTime(dayIndex, sessionIndex, e.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeSession(dayIndex, sessionIndex)}
                            className="mr-auto rounded p-0.5 text-red-400 hover:text-red-600"
                            title="حذف سانس"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {isExternal ? (
                          <input
                            type="url"
                            dir="ltr"
                            placeholder="لینک خرید سانس"
                            className="mt-1.5 w-full rounded border border-slate-200 bg-white px-2 py-1 text-left text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                            value={session.purchaseUrl ?? ""}
                            onChange={(e) =>
                              updateSessionPurchaseUrl(
                                dayIndex,
                                sessionIndex,
                                e.target.value
                              )
                            }
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={formData.published}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, published: e.target.checked }))
            }
            className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          انتشار در سایت (نمایش در شهر و دسته مربوطه)
        </label>

        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={formData.popular}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, popular: e.target.checked }))
            }
            className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          نمایش در بخش «رویدادهای محبوب» صفحه اصلی
        </label>

        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, featured: e.target.checked }))
            }
            className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          نمایش در بنر «پیشنهاد ویژه» برای همین شهر (حداکثر ۴ رویداد در هر شهر)
        </label>

        {formData.featured ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-200">
              تصویر بنر پیشنهاد ویژه <span className="text-red-500">*</span>
            </label>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleBannerImageSelect(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                disabled={bannerImageProcessing}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-white px-4 py-3 text-sm font-bold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/40 dark:bg-slate-900 dark:text-amber-100"
              >
                <Upload className="h-4 w-4" />
                {bannerImageProcessing ? "در حال پردازش بنر..." : "آپلود تصویر بنر"}
              </button>
              {bannerImageFile ? (
                <button
                  type="button"
                  onClick={() => {
                    handleBannerImageSelect(null);
                    if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
                  }}
                  className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  حذف بنر انتخاب‌شده
                </button>
              ) : null}
            </div>

            <p className="mb-3 text-xs leading-6 text-amber-900/80 dark:text-amber-100/80">
              {EVENT_BANNER_IMAGE_RECOMMENDED_TEXT}
            </p>

            {previewBannerImageUrl ? (
              <EventImagePreviews
                variant="banner"
                imageUrl={previewBannerImageUrl}
                title={formData.title || "نام رویداد"}
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl bg-white/70 text-sm text-amber-800 dark:bg-slate-900/60 dark:text-amber-200">
                تصویر بنر انتخاب نشده
              </div>
            )}
          </div>
        ) : null}
      </div>
        </>
      ) : null}

      {showMainForm ? (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 py-4 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-blue-600 py-4 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting
            ? "در حال ذخیره..."
            : initialEvent
              ? "ذخیره تغییرات"
              : "انتشار رویداد"}
        </button>
      </div>
      ) : null}
    </form>
  );
}
