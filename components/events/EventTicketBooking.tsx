"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock, ExternalLink, Ticket } from "lucide-react";
import type { EventDay } from "@/lib/events/types";
import { formatPersianDateLong } from "@/lib/events/date-utils";

type EventTicketBookingProps = {
  schedule: EventDay[];
  unavailable: boolean;
  unavailableMessage: string;
};

export default function EventTicketBooking({
  schedule,
  unavailable,
  unavailableMessage,
}: EventTicketBookingProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);

  const selectedDay = schedule[selectedDayIndex];
  const selectedSession = selectedDay?.sessions[selectedSessionIndex];
  const hasPurchaseLink = Boolean(selectedSession?.purchaseUrl?.trim());

  const dayLabel = useMemo(() => {
    if (!selectedDay) return "";
    return formatPersianDateLong(selectedDay.date);
  }, [selectedDay]);

  const handlePurchase = () => {
    if (!selectedSession?.purchaseUrl?.trim()) {
      alert("لینک خرید برای این سانس ثبت نشده است.");
      return;
    }

    window.open(selectedSession.purchaseUrl, "_blank", "noopener,noreferrer");
  };

  if (unavailable) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-black text-neutral-900">خرید بلیط</h2>
        </div>
        <div className="rounded-2xl bg-neutral-200 py-5 text-center text-base font-black text-neutral-600">
          {unavailableMessage}
        </div>
      </div>
    );
  }

  if (schedule.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Ticket className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-black text-neutral-900">انتخاب روز و سانس</h2>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700">
            <CalendarDays className="h-4 w-4 text-red-500" />
            <span>روز برگزاری</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule.map((day, index) => (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  setSelectedDayIndex(index);
                  setSelectedSessionIndex(0);
                }}
                className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                  selectedDayIndex === index
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-red-200"
                }`}
              >
                {formatPersianDateLong(day.date)}
              </button>
            ))}
          </div>
        </div>

        {selectedDay && selectedDay.sessions.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700">
              <Clock className="h-4 w-4 text-red-500" />
              <span>سانس {dayLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {selectedDay.sessions.map((session, index) => {
                const linked = Boolean(session.purchaseUrl?.trim());
                return (
                  <button
                    key={`${selectedDay.date}-${session.time}-${index}`}
                    type="button"
                    onClick={() => setSelectedSessionIndex(index)}
                    className={`rounded-2xl border px-4 py-3 text-center transition ${
                      selectedSessionIndex === index
                        ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-red-200"
                    }`}
                  >
                    <div className="text-base font-black">{session.time}</div>
                    <div className="mt-1 text-[11px] font-medium text-neutral-500">
                      {linked ? "قابل خرید" : "بدون لینک"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-sm font-bold text-neutral-800">انتخاب شما</p>
          <p className="mt-1 text-sm text-neutral-600">
            {dayLabel} — سانس {selectedSession?.time ?? "—"}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePurchase}
          disabled={!hasPurchaseLink}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-base font-black text-white transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          <ExternalLink className="h-5 w-5" />
          {hasPurchaseLink ? "رفتن به صفحه خرید بلیط" : "لینک خرید ثبت نشده"}
        </button>
      </div>
    </div>
  );
}
