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
  EVENT_CATEGORY_EVENT,
  type EventDay,
  type EventFormData,
  type EventItem,
} from "@/lib/events/types";
import { getEventSchedule, isEventEnded, normalizeDateString, normalizeEventDays, normalizeTimeString } from "@/lib/events/date-utils";
import { hasUploadedImage } from "@/lib/events/helpers";
import { EVENT_IMAGE_RECOMMENDED_TEXT } from "@/lib/events/image-specs";
import { processEventImageFile } from "@/lib/events/process-event-image";
import EventImagePreviews from "@/components/admin/EventImagePreviews";
import VenuePlaceAutocomplete from "@/components/venues/VenuePlaceAutocomplete";

const emptyForm = (): EventFormData => ({
  title: "",
  city: "",
  category: "کنسرت",
  place: "",
  placeAddress: "",
  venueTemplateId: null,
  price: "",
  image: "",
  badge: "",
  days: [],
  published: true,
  popular: false,
  featured: false,
  status: "active",
});

type EventFormProps = {
  initialEvent?: EventItem | null;
  onSubmit: (data: EventFormData, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

export default function EventForm({
  initialEvent,
  onSubmit,
  onCancel,
  submitting = false,
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>(emptyForm);
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
    if (!initialEvent) {
      setFormData(emptyForm());
      setStartPickerValue(null);
      setEndPickerValue(null);
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    const schedule = getEventSchedule(initialEvent);
    setFormData({
      title: initialEvent.title,
      city: initialEvent.city,
      category: initialEvent.category,
      place: initialEvent.place,
      placeAddress: initialEvent.placeAddress ?? "",
      venueTemplateId: initialEvent.venueTemplateId ?? null,
      price: initialEvent.price,
      image: initialEvent.image,
      badge: initialEvent.badge ?? "",
      days: schedule,
      published: initialEvent.published !== false,
      popular: initialEvent.popular === true,
      featured: initialEvent.featured === true,
      status:
        initialEvent.status === "held" || initialEvent.status === "draft"
          ? "active"
          : (initialEvent.status ?? "active"),
    });
    setImageFile(null);
    setImagePreview(null);

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
    }
  }, [initialEvent]);

  useEffect(() => {
    if (!startPickerValue || !endPickerValue) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile && !hasUploadedImage(formData.image) && !formData.image.trim()) {
      alert("آپلود تصویر رویداد الزامی است.");
      return;
    }

    if (!initialEvent && !imageFile && !hasUploadedImage(formData.image)) {
      alert("برای رویداد جدید، آپلود تصویر الزامی است.");
      return;
    }

    await onSubmit(formData, imageFile);
  };

  const previewImageUrl =
    imagePreview ?? (hasUploadedImage(formData.image) ? formData.image : "");

  const isPastDate = useMemo(() => {
    if (formData.days.length === 0) return false;
    return isEventEnded({ date: "", time: "", days: formData.days });
  }, [formData.days]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          {formData.category === EVENT_CATEGORY_EVENT ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              ایونت‌ها با تیکتینگ داخلی (QR) مدیریت می‌شوند؛ کنسرت و تئاتر به لینک خارجی متصل می‌مانند.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            مکان برگزاری
          </label>
          <VenuePlaceAutocomplete
            variant="admin"
            city={formData.city}
            value={formData.place}
            venueTemplateId={formData.venueTemplateId ?? null}
            placeAddress={formData.placeAddress ?? ""}
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
            قیمت
          </label>
          <input
            type="text"
            required
            value={formData.price}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="مثلاً: از ۳۵۰ هزار تومان"
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
          تصویر رویداد <span className="text-red-500">*</span>
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
            {imageProcessing ? "در حال پردازش تصویر..." : "آپلود از کامپیوتر"}
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
          {EVENT_IMAGE_RECOMMENDED_TEXT}
        </p>

        {previewImageUrl ? (
          <EventImagePreviews
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

      <div className="space-y-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/60">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">زمان‌بندی سانس‌ها</h2>

        {formData.days.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ابتدا بازه تاریخ را از تقویم شمسی انتخاب کن.
          </p>
        )}

        {formData.days.map((day, dayIndex) => (
          <div
            key={day.date}
            className="relative space-y-3 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => removeDay(dayIndex)}
              className="absolute left-3 top-3 text-red-400 hover:text-red-600"
              title="حذف این روز"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">تاریخ:</label>
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {day.date}
              </div>
              <button
                type="button"
                onClick={() => addSession(dayIndex)}
                className="mr-auto text-xs font-bold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                + اضافه کردن سانس
              </button>
            </div>

            <div className="space-y-3">
              {day.sessions.map((session, sessionIndex) => (
                <div
                  key={`${day.date}-${sessionIndex}`}
                  className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="whitespace-nowrap text-xs font-bold text-slate-600 dark:text-slate-300">
                      سانس {sessionIndex + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="20:00"
                      className="w-24 rounded border border-slate-200 bg-white p-1.5 text-center text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      value={session.time}
                      onChange={(e) =>
                        updateSessionTime(dayIndex, sessionIndex, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeSession(dayIndex, sessionIndex)}
                      className="mr-auto text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      لینک صفحه خرید این سانس
                    </label>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://example.com/buy/..."
                      className="w-full rounded border border-slate-200 bg-white p-2 text-left text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      value={session.purchaseUrl ?? ""}
                      onChange={(e) =>
                        updateSessionPurchaseUrl(
                          dayIndex,
                          sessionIndex,
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
      </div>

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
    </form>
  );
}
