"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Upload, X } from "lucide-react";
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
import { EVENT_IMAGE_RECOMMENDED_TEXT } from "@/lib/events/image-specs";
import { processEventImageFile } from "@/lib/events/process-event-image";
import EventImagePreviews from "@/components/admin/EventImagePreviews";
import { MY_EVENT_CATEGORIES } from "@/lib/my-event/categories";
import { MY_EVENT_SEATING_AFTER_APPROVAL_HINT, MY_EVENT_LINKED_VENUE_SEATING_HINT } from "@/lib/my-event/constants";
import { getCategoryExamples } from "@/lib/my-event/category-examples";
import { formatMyEventEventLinkPreview } from "@/lib/my-event/domains";
import {
  buildPublicEventSlug,
  normalizePublicEventSlug,
} from "@/lib/my-event/public-slugs";
import VenuePlaceAutocomplete from "@/components/my-event/VenuePlaceAutocomplete";

export type MyEventEventFormValues = {
  title: string;
  publicEventSlug: string;
  city: string;
  category: string;
  place: string;
  venueTemplateId: number | null;
  placeAddress: string;
  price: string;
  description: string;
  image: string;
  days: EventDay[];
  hasAssignedSeating: boolean | null;
  listOnBilitmall: boolean;
};

type MyEventEventFormProps = {
  organizerSlug: string;
  eventId?: number;
  eventApproved?: boolean;
  hasSeatingPlan?: boolean;
  initialValues?: Partial<MyEventEventFormValues> | null;
  onSubmit: (values: MyEventEventFormValues, imageFile: File | null) => Promise<void>;
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
  price: "",
  description: "",
  image: "",
  days: [],
  hasAssignedSeating: null,
  listOnBilitmall: false,
};

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900 dark:text-white";
const labelClass = "mb-2 block text-sm font-bold text-neutral-700 dark:text-slate-300";

export default function MyEventEventForm({
  organizerSlug,
  eventId,
  eventApproved = false,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialValues) {
        setFormData(emptyMyEventFormValues);
        setSlugTouched(false);
        setStartPickerValue(null);
        setEndPickerValue(null);
        setImageFile(null);
        setImagePreview(null);
        return;
      }

      const days = normalizeEventDays(initialValues.days ?? []);
      setFormData({
        ...emptyMyEventFormValues,
        ...initialValues,
        days,
      });
      setSlugTouched(Boolean(initialValues.publicEventSlug));
      setImageFile(null);
      setImagePreview(null);

      if (days.length > 0) {
        const firstDate = new DateObject({
          date: normalizeDateString(days[0].date),
          format: "YYYY/MM/DD",
          calendar: persian,
        });
        const lastDate = new DateObject({
          date: normalizeDateString(days[days.length - 1].date),
          format: "YYYY/MM/DD",
          calendar: persian,
        });
        setStartPickerValue(firstDate);
        setEndPickerValue(lastDate);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      alert("دسته‌بندی را انتخاب کنید.");
      return;
    }

    if (formData.hasAssignedSeating === null) {
      alert("لطفاً نوع صندلی‌گذاری را مشخص کنید.");
      return;
    }

    if (formData.days.length === 0) {
      alert("بازه تاریخ و حداقل یک سانس الزامی است.");
      return;
    }

    const publicEventSlug = normalizePublicEventSlug(formData.publicEventSlug);
    if (!publicEventSlug) {
      alert("نام انگلیسی لینک رویداد را وارد کنید (مثلاً asrhajar).");
      return;
    }

    if (!imageFile && !hasUploadedImage(formData.image) && !formData.image.trim()) {
      alert("آپلود تصویر رویداد الزامی است.");
      return;
    }

    if (!isEdit && !imageFile && !hasUploadedImage(formData.image)) {
      alert("برای رویداد جدید، آپلود تصویر الزامی است.");
      return;
    }

    await onSubmit(
      {
        ...formData,
        publicEventSlug,
        days: normalizeEventDays(formData.days),
      },
      imageFile
    );
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
                onClick={() => setFormData({ ...emptyMyEventFormValues, category: cat })}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-right transition hover:border-emerald-500/50 hover:bg-emerald-500/5 dark:border-white/10 dark:bg-slate-900"
              >
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{cat}</p>
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

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
        <div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">دسته انتخاب‌شده</p>
          <p className="font-black text-neutral-900 dark:text-white">{formData.category}</p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...emptyMyEventFormValues })}
          className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white"
        >
          تغییر دسته
        </button>
      </div>

      <div>
        <label className={labelClass}>نام رویداد</label>
        {examples?.titleHint ? (
          <p className="mb-2 text-xs text-neutral-400 dark:text-slate-500">{examples.titleHint}</p>
        ) : null}
        <input
          type="text"
          required
          value={formData.title}
          placeholder={examples?.title ?? "عنوان رویداد"}
          onChange={(e) => {
            const title = e.target.value;
            setFormData((prev) => ({
              ...prev,
              title,
              publicEventSlug: slugTouched
                ? prev.publicEventSlug
                : buildPublicEventSlug(title),
            }));
          }}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          نام انگلیسی لینک رویداد <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <p className="mb-2 text-xs text-neutral-400 dark:text-slate-500">
          فقط حروف کوچک انگلیسی، عدد و خط تیره. اگر خودکار درست نشد، خودتان بنویسید.
        </p>
        <input
          type="text"
          required
          dir="ltr"
          value={formData.publicEventSlug}
          placeholder={examples?.publicEventSlug ?? "asrhajar"}
          onChange={(e) => {
            setSlugTouched(true);
            setFormData({
              ...formData,
              publicEventSlug: normalizePublicEventSlug(e.target.value),
            });
          }}
          className={`${inputClass} font-mono`}
        />
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">پیش‌نمایش لینک صفحه اختصاصی</p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>شهر</label>
          <CityAutocomplete
            includeAllCities
            required
            value={formData.city}
            className="w-full rounded-xl border border-neutral-300 bg-white py-3 pr-10 pl-9 text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            onChange={(city) =>
              setFormData((prev) => ({
                ...prev,
                city,
                venueTemplateId: null,
                placeAddress: "",
              }))
            }
          />
        </div>
        <div>
          <label className={labelClass}>مکان برگزاری</label>
          <VenuePlaceAutocomplete
            city={formData.city}
            value={formData.place}
            venueTemplateId={formData.venueTemplateId}
            placeAddress={formData.placeAddress}
            onChange={(place, venueTemplateId, placeAddress) =>
              setFormData({ ...formData, place, venueTemplateId, placeAddress })
            }
            placeholder={examples?.place ?? "مکان برگزاری"}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>قیمت</label>
        <input
          type="text"
          required
          value={formData.price}
          placeholder={examples?.price ?? "قیمت"}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          تصویر رویداد <span className="text-red-500 dark:text-red-400">*</span>
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
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-700 transition hover:border-emerald-500/50 disabled:opacity-60 dark:border-white/20 dark:bg-slate-900 dark:text-slate-200"
          >
            <Upload className="h-4 w-4" />
            {imageProcessing ? "در حال پردازش تصویر..." : "آپلود از کامپیوتر"}
          </button>
          {imageFile ? (
            <button
              type="button"
              onClick={() => {
                handleImageSelect(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="inline-flex items-center gap-1 text-sm font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="h-4 w-4" />
              حذف فایل
            </button>
          ) : null}
        </div>
        <p className="mb-3 text-xs leading-6 text-neutral-400 dark:text-slate-500">{EVENT_IMAGE_RECOMMENDED_TEXT}</p>
        {previewImageUrl ? (
          <EventImagePreviews
            imageUrl={previewImageUrl}
            title={formData.title || "نام رویداد"}
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-neutral-100 text-sm text-neutral-400 dark:bg-slate-900 dark:text-slate-500">
            تصویری انتخاب نشده
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>از تاریخ</label>
          <div className="rounded-xl border border-neutral-300 bg-white p-2 focus-within:border-emerald-500 dark:border-white/10 dark:bg-slate-900">
            <DatePicker
              value={startPickerValue}
              onChange={(date) => setStartPickerValue(date as DateObject)}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              format="YYYY/MM/DD"
              inputClass="w-full bg-transparent p-2 text-neutral-900 outline-none dark:text-white"
              placeholder="انتخاب تاریخ شروع"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>تا تاریخ</label>
          <div className="rounded-xl border border-neutral-300 bg-white p-2 focus-within:border-emerald-500 dark:border-white/10 dark:bg-slate-900">
            <DatePicker
              value={endPickerValue}
              onChange={(date) => setEndPickerValue(date as DateObject)}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              format="YYYY/MM/DD"
              inputClass="w-full bg-transparent p-2 text-neutral-900 outline-none dark:text-white"
              placeholder="انتخاب تاریخ پایان"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-900/50">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-slate-200">زمان‌بندی سانس‌ها</h2>
        {formData.days.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-slate-500">ابتدا بازه تاریخ را از تقویم شمسی انتخاب کنید.</p>
        ) : null}
        {formData.days.map((day, dayIndex) => (
          <div
            key={day.date}
            className="relative space-y-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => removeDay(dayIndex)}
              className="absolute left-3 top-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              title="حذف این روز"
            >
              ✕
            </button>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-bold text-neutral-700 dark:text-slate-300">تاریخ:</span>
              <span className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700 dark:bg-slate-800 dark:text-slate-200" dir="ltr">
                {day.date}
              </span>
              <button
                type="button"
                onClick={() => addSession(dayIndex)}
                className="mr-auto text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                + اضافه کردن سانس
              </button>
            </div>
            <div className="space-y-3">
              {day.sessions.map((session, sessionIndex) => (
                <div
                  key={`${day.date}-${sessionIndex}`}
                  className="flex items-center gap-3 rounded-lg bg-neutral-100 p-3 dark:bg-slate-800/80"
                >
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400">
                    سانس {sessionIndex + 1}
                  </span>
                  <input
                    type="time"
                    required
                    value={session.time}
                    onChange={(e) =>
                      updateSessionTime(dayIndex, sessionIndex, e.target.value)
                    }
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    dir="ltr"
                  />
                  {day.sessions.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSession(dayIndex, sessionIndex)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      حذف
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className={labelClass}>آیا برای میهمانان جایگاه صندلی مشخص تعریف شود؟</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, hasAssignedSeating: true })}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              formData.hasAssignedSeating === true
                ? "bg-emerald-600 text-white"
                : "border border-neutral-300 bg-white text-neutral-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            بله، صندلی مشخص
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, hasAssignedSeating: false })}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              formData.hasAssignedSeating === false
                ? "bg-emerald-600 text-white"
                : "border border-neutral-300 bg-white text-neutral-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            خیر، بدون صندلی ثابت
          </button>
        </div>
        {formData.hasAssignedSeating === true ? (
          <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            {usesLinkedVenue ? (
              <p className="text-sm leading-7 text-emerald-700 dark:text-emerald-200">
                {MY_EVENT_LINKED_VENUE_SEATING_HINT}
              </p>
            ) : eventId && eventApproved ? (
              <div className="space-y-3">
                {hasSeatingPlan ? (
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    ✓ صحنه و نقشه صندلی‌ها تعریف شده است.
                  </p>
                ) : null}
                <Link
                  href={`/my-event/events/${eventId}/seating`}
                  className="inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-500"
                >
                  {hasSeatingPlan ? "ویرایش صحنه و نقشه صندلی‌ها" : "ساخت صحنه و نقشه صندلی‌ها"}
                </Link>
              </div>
            ) : (
              <p className="text-sm leading-7 text-violet-700 dark:text-violet-200">
                {MY_EVENT_SEATING_AFTER_APPROVAL_HINT}
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div>
        <p className={labelClass}>کانال‌های انتشار</p>
        <p className="mb-3 text-xs text-neutral-400 dark:text-slate-500">
          می‌توانید هر دو را با هم انتخاب کنید. هر کانال پس از تأیید جداگانه ادمین فعال می‌شود.
        </p>
        <div className="space-y-2">
          <label className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <input type="checkbox" checked readOnly className="h-4 w-4 accent-emerald-500" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-200">صفحه اختصاصی My Event</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 hover:border-emerald-500/40 dark:border-white/10 dark:bg-slate-900 dark:hover:border-emerald-500/30">
            <input
              type="checkbox"
              checked={formData.listOnBilitmall}
              onChange={(e) =>
                setFormData({ ...formData, listOnBilitmall: e.target.checked })
              }
              className="h-4 w-4 accent-emerald-500"
            />
            <span className="text-sm font-bold text-neutral-700 dark:text-slate-200">انتشار در سایت بلیت‌مال</span>
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass}>توضیحات (صفحه اختصاصی)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder={examples?.description ?? "توضیحات رویداد"}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "در حال ذخیره..." : submitLabel}
      </button>
    </form>
  );
}
