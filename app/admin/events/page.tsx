"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface Session {
  time: string;
}

interface EventDay {
  date: string;
  sessions: Session[];
}

export default function NewEventPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    city: "تهران",
    startDate: "",
    endDate: "",
    image: "/images/default-event.jpg",
    category: "کنسرت",
    days: [] as EventDay[],
  });

  const [startPickerValue, setStartPickerValue] = useState<DateObject | null>(null);
  const [endPickerValue, setEndPickerValue] = useState<DateObject | null>(null);

  useEffect(() => {
    if (!startPickerValue || !endPickerValue) return;

    const start = new DateObject(startPickerValue).toDate();
    const end = new DateObject(endPickerValue).toDate();

    if (start > end) return;

    const generatedDays: EventDay[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateObj = new DateObject({
        date: current,
        calendar: persian,
        locale: persian_fa,
      });

      generatedDays.push({
        date: dateObj.format("YYYY/MM/DD"),
        sessions: [{ time: "18:00" }], 
      });

      current.setDate(current.getDate() + 1);
    }

    setFormData((prev) => ({
      ...prev,
      startDate: startPickerValue.format("YYYY/MM/DD"),
      endDate: endPickerValue.format("YYYY/MM/DD"),
      days: generatedDays,
    }));
  }, [startPickerValue, endPickerValue]);

  const addSession = (dayIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].sessions.push({ time: "20:00" });
    setFormData({ ...formData, days: newDays });
  };

  const removeDay = (dayIndex: number) => {
    const newDays = formData.days.filter((_, index) => index !== dayIndex);
    setFormData({ ...formData, days: newDays });
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
    newDays[dayIndex].sessions[sessionIndex].time = time;
    setFormData({ ...formData, days: newDays });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("داده‌های نهایی:", formData);
    alert("رویداد با موفقیت ثبت شد");
    router.push("/admin/events");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8" dir="rtl">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">
          تعریف رویداد جدید
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* نام رویداد */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              نام رویداد
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
              placeholder="مثلاً: کنسرت همایون شجریان"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                شهر
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              >
                <option value="تهران">تهران</option>
                <option value="شیراز">شیراز</option>
                <option value="اصفهان">اصفهان</option>
                <option value="مشهد">مشهد</option>
                <option value="تبریز">تبریز</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                دسته‌بندی
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="کنسرت">کنسرت</option>
                <option value="تئاتر">تئاتر</option>
                <option value="ورزشی">ورزشی</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                از تاریخ
              </label>
              <div className="rounded-xl border border-slate-200 p-2 focus-within:border-blue-500">
                <DatePicker
                  value={startPickerValue}
                  onChange={(date) => setStartPickerValue(date as DateObject)}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="YYYY/MM/DD"
                  inputClass="w-full outline-none p-2"
                  placeholder="انتخاب تاریخ شروع"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                تا تاریخ
              </label>
              <div className="rounded-xl border border-slate-200 p-2 focus-within:border-blue-500">
                <DatePicker
                  value={endPickerValue}
                  onChange={(date) => setEndPickerValue(date as DateObject)}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="YYYY/MM/DD"
                  inputClass="w-full outline-none p-2"
                  placeholder="انتخاب تاریخ پایان"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 rounded-2xl bg-slate-100 p-4">
            <h2 className="text-lg font-semibold text-slate-700">
              زمان‌بندی سانس‌ها
            </h2>

            {formData.days.length === 0 && (
              <p className="text-sm text-slate-500">
                ابتدا بازه تاریخ را از تقویم شمسی انتخاب کن.
              </p>
            )}

            {formData.days.map((day, dIdx) => (
              <div
                key={dIdx}
                className="relative space-y-3 rounded-xl bg-white p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => removeDay(dIdx)}
                  className="absolute left-3 top-3 text-red-400 hover:text-red-600"
                  title="حذف این روز"
                >
                  ✕
                </button>

                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-slate-700">
                    تاریخ:
                  </label>
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                    {day.date}
                  </div>

                  <button
                    type="button"
                    onClick={() => addSession(dIdx)}
                    className="mr-auto text-xs font-bold text-green-600 hover:text-green-700"
                  >
                    + اضافه کردن سانس
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {day.sessions.map((session, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                    >
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        سانس {sIdx + 1}:
                      </span>
                      {/* تغییر فیلد از time به text برای اجبار به فرمت 24 ساعته */}
                      <input
                        type="text"
                        placeholder="20:00"
                        className="w-full rounded border border-slate-200 p-1 text-center text-sm outline-none focus:border-blue-500"
                        value={session.time}
                        onChange={(e) =>
                          updateSessionTime(dIdx, sIdx, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeSession(dIdx, sIdx)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition-colors hover:bg-blue-700"
          >
            انتشار رویداد
          </button>
        </form>
      </div>
    </main>
  );
}
