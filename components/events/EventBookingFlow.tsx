"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  MapPin,
  Ticket,
} from "lucide-react";
import type { EventDay, TicketingType } from "@/lib/events/types";
import { formatPersianDateLong } from "@/lib/events/date-utils";
import type { SeatingLayout } from "@/lib/seating/types";
import SeatingPlanPicker from "@/components/events/SeatingPlanPicker";

type FlowStep = "schedule" | "seats" | "payment" | "external" | "success";

type EventBookingFlowProps = {
  eventId: number;
  eventTitle: string;
  eventPrice: string;
  place: string;
  city: string;
  schedule: EventDay[];
  unavailable: boolean;
  unavailableMessage: string;
  ticketingType?: TicketingType;
  hasAssignedSeating?: boolean;
  variant?: "bilitmall" | "organizer";
};

const themes = {
  bilitmall: {
    chipActive: "border-red-400 bg-red-500/25 text-white shadow-lg shadow-red-500/20",
    chipIdle: "border-white/15 bg-white/10 text-white/85 hover:border-red-400/40",
    btn: "bg-red-600 hover:bg-red-500",
    stepActive: "bg-red-500 text-white",
    stepDone: "bg-red-500/30 text-red-200",
    stepIdle: "bg-white/10 text-white/50",
    line: "bg-red-500/40",
  },
  organizer: {
    chipActive: "border-emerald-400 bg-emerald-500/25 text-white shadow-lg shadow-emerald-500/20",
    chipIdle: "border-white/15 bg-white/10 text-white/85 hover:border-emerald-400/40",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    stepActive: "bg-emerald-500 text-white",
    stepDone: "bg-emerald-500/30 text-emerald-200",
    stepIdle: "bg-white/10 text-white/50",
    line: "bg-emerald-500/40",
  },
};

function formatRial(rial: number): string {
  return `${rial.toLocaleString("fa-IR")} تومان`;
}

export default function EventBookingFlow({
  eventId,
  eventTitle,
  eventPrice,
  place,
  city,
  schedule,
  unavailable,
  unavailableMessage,
  ticketingType = "EXTERNAL_LINK",
  hasAssignedSeating = false,
  variant = "bilitmall",
}: EventBookingFlowProps) {
  const theme = themes[variant];

  const [step, setStep] = useState<FlowStep>("schedule");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [seatingLayout, setSeatingLayout] = useState<SeatingLayout | null>(null);
  const [seatingLoading, setSeatingLoading] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [ticketRef, setTicketRef] = useState("");
  const [paying, setPaying] = useState(false);

  const selectedDay = schedule[selectedDayIndex];
  const selectedSession = selectedDay?.sessions[selectedSessionIndex];

  const isExternalFlow =
    ticketingType === "EXTERNAL_LINK" || Boolean(selectedSession?.purchaseUrl?.trim());

  const stepLabels = useMemo(() => {
    if (isExternalFlow) return ["انتخاب زمان", "رفتن به خرید"];
    if (hasAssignedSeating) return ["انتخاب زمان", "انتخاب جایگاه", "پرداخت", "دریافت بلیت"];
    return ["انتخاب زمان", "پرداخت", "دریافت بلیت"];
  }, [isExternalFlow, hasAssignedSeating]);

  const stepIndex = useMemo(() => {
    if (step === "schedule") return 0;
    if (step === "seats") return 1;
    if (step === "payment" || step === "external") {
      return isExternalFlow ? 1 : hasAssignedSeating ? 2 : 1;
    }
    return stepLabels.length - 1;
  }, [step, isExternalFlow, hasAssignedSeating, stepLabels.length]);

  const dayLabel = selectedDay ? formatPersianDateLong(selectedDay.date) : "";

  const selectedSeatsTotal = useMemo(() => {
    if (!seatingLayout) return 0;
    const set = new Set(selectedSeatIds);
    return seatingLayout.cells
      .filter((c) => set.has(c.id) && c.type === "seat")
      .reduce((sum, c) => sum + c.priceRial, 0);
  }, [seatingLayout, selectedSeatIds]);

  const quantity = selectedSeatIds.length || 1;
  const displayAmount =
    selectedSeatsTotal > 0 ? formatRial(selectedSeatsTotal) : eventPrice;

  useEffect(() => {
    if (step !== "seats" || !hasAssignedSeating || seatingLayout || seatingLoading) return;

    setSeatingLoading(true);
    fetch(`/api/events/${eventId}/seating-plan`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hasSeatingPlan && data.layout) {
          setSeatingLayout(data.layout as SeatingLayout);
        } else {
          setStep("payment");
        }
      })
      .catch(() => setStep("payment"))
      .finally(() => setSeatingLoading(false));
  }, [step, eventId, hasAssignedSeating, seatingLayout, seatingLoading]);

  function toggleSeat(seatId: string) {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  }

  function goAfterSchedule() {
    if (isExternalFlow) {
      setStep("external");
      return;
    }
    if (hasAssignedSeating) {
      setStep("seats");
      return;
    }
    setStep("payment");
  }

  function openExternalLink() {
    const url = selectedSession?.purchaseUrl?.trim();
    if (!url) {
      alert("لینک خرید برای این سانس ثبت نشده است.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handlePayment() {
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    const ref = `BM-${eventId}-${Date.now().toString(36).toUpperCase()}`;
    setTicketRef(ref);
    setPaying(false);
    setStep("success");
  }

  if (unavailable) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="h-5 w-5 text-white/70" />
          <h2 className="text-lg font-black">خرید بلیط</h2>
        </div>
        <div className="rounded-2xl bg-white/10 py-8 text-center text-base font-black text-white/70">
          {unavailableMessage}
        </div>
      </div>
    );
  }

  if (schedule.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/45 shadow-2xl backdrop-blur-md">
      <StepIndicator
        labels={stepLabels}
        currentIndex={stepIndex}
        theme={theme}
        done={step === "success"}
      />

      <div className="p-5 sm:p-6">
        {step === "schedule" ? (
          <div className="space-y-6">
            <SectionTitle icon={CalendarDays} title="روز برگزاری" />
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
                    selectedDayIndex === index ? theme.chipActive : theme.chipIdle
                  }`}
                >
                  {formatPersianDateLong(day.date)}
                </button>
              ))}
            </div>

            {selectedDay && selectedDay.sessions.length > 0 ? (
              <>
                <SectionTitle icon={Clock} title={`سانس — ${dayLabel}`} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedDay.sessions.map((session, index) => (
                    <button
                      key={`${selectedDay.date}-${session.time}-${index}`}
                      type="button"
                      onClick={() => setSelectedSessionIndex(index)}
                      className={`rounded-2xl border px-3 py-3 text-center transition ${
                        selectedSessionIndex === index ? theme.chipActive : theme.chipIdle
                      }`}
                    >
                      <div className="text-lg font-black">{session.time}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <SummaryCard
              lines={[
                { label: "روز", value: dayLabel },
                { label: "سانس", value: selectedSession?.time ?? "—" },
                { label: "مکان", value: `${place} — ${city}` },
              ]}
            />

            <button
              type="button"
              onClick={goAfterSchedule}
              className={`w-full rounded-2xl py-4 text-base font-black text-white transition ${theme.btn}`}
            >
              ادامه
            </button>
          </div>
        ) : null}

        {step === "seats" ? (
          <div className="space-y-5">
            <SectionTitle icon={MapPin} title="انتخاب جایگاه" />
            {seatingLoading ? (
              <p className="py-8 text-center text-sm text-white/60">در حال بارگذاری نقشه سالن...</p>
            ) : seatingLayout ? (
              <SeatingPlanPicker
                layout={seatingLayout}
                selectedIds={selectedSeatIds}
                onToggleSeat={(id) => toggleSeat(id)}
                variant={variant}
              />
            ) : (
              <p className="text-sm text-white/60">نقشه سالن در دسترس نیست.</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80"
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={selectedSeatIds.length === 0}
                onClick={() => setStep("payment")}
                className={`flex-1 rounded-2xl py-3 text-sm font-black text-white disabled:opacity-40 ${theme.btn}`}
              >
                ادامه به پرداخت
              </button>
            </div>
          </div>
        ) : null}

        {step === "external" ? (
          <div className="space-y-6">
            <SectionTitle icon={ExternalLink} title="خرید از سایت برگزارکننده" />
            <p className="text-sm leading-7 text-white/75">
              برای این رویداد، خرید بلیت از طریق سایت اصلی برگزارکننده انجام می‌شود. زمان
              انتخاب‌شده را یادداشت کنید و روی دکمه زیر بزنید.
            </p>
            <SummaryCard
              lines={[
                { label: "رویداد", value: eventTitle },
                { label: "روز", value: dayLabel },
                { label: "سانس", value: selectedSession?.time ?? "—" },
              ]}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80"
              >
                قبلی
              </button>
              <button
                type="button"
                onClick={openExternalLink}
                disabled={!selectedSession?.purchaseUrl?.trim()}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white disabled:opacity-40 ${theme.btn}`}
              >
                <ExternalLink className="h-5 w-5" />
                رفتن به صفحه خرید
              </button>
            </div>
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="space-y-6">
            <SectionTitle icon={CreditCard} title="پرداخت" />
            <SummaryCard
              lines={[
                { label: "رویداد", value: eventTitle },
                { label: "روز", value: dayLabel },
                { label: "سانس", value: selectedSession?.time ?? "—" },
                {
                  label: "جایگاه",
                  value:
                    selectedSeatIds.length > 0
                      ? `${selectedSeatIds.length} صندلی`
                      : "بدون صندلی ثابت",
                },
                { label: "مبلغ", value: displayAmount },
                { label: "تعداد", value: String(quantity) },
              ]}
            />
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/55">
              پرداخت آنلاین امن — پس از تأیید، بلیت الکترونیکی صادر می‌شود.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setStep(hasAssignedSeating && seatingLayout ? "seats" : "schedule")
                }
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80"
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={paying}
                onClick={handlePayment}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white disabled:opacity-60 ${theme.btn}`}
              >
                <CreditCard className="h-5 w-5" />
                {paying ? "در حال پردازش..." : "پرداخت و دریافت بلیت"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="space-y-6 py-4 text-center">
            <CheckCircle2
              className={`mx-auto h-16 w-16 ${variant === "bilitmall" ? "text-red-400" : "text-emerald-400"}`}
            />
            <h2 className="text-xl font-black">بلیت شما صادر شد</h2>
            <p className="text-sm text-white/70">
              {dayLabel} — سانس {selectedSession?.time}
            </p>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-5">
              <p className="text-xs text-white/50">کد پیگیری</p>
              <p className="mt-2 font-mono text-2xl font-black tracking-wider" dir="ltr">
                {ticketRef}
              </p>
            </div>
            <p className="text-xs text-white/45">
              این کد را نگه دارید. بلیت الکترونیکی به زودی به حساب شما اضافه می‌شود.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("schedule");
                setSelectedSeatIds([]);
                setTicketRef("");
              }}
              className={`rounded-2xl px-6 py-3 text-sm font-bold text-white ${theme.btn}`}
            >
              خرید بلیت دیگر
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-white/70" />
      <h3 className="text-sm font-black text-white/90">{title}</h3>
    </div>
  );
}

function SummaryCard({ lines }: { lines: { label: string; value: string }[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-4 text-sm">
            <span className="text-white/50">{line.label}</span>
            <span className="font-bold text-white/90">{line.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepIndicator({
  labels,
  currentIndex,
  theme,
  done,
}: {
  labels: string[];
  currentIndex: number;
  theme: (typeof themes)["bilitmall"];
  done: boolean;
}) {
  return (
    <div className="border-b border-white/10 bg-black/30 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-1">
        {labels.map((label, index) => {
          const isActive = !done && index === currentIndex;
          const isDone = done || index < currentIndex;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition ${
                  isActive ? theme.stepActive : isDone ? theme.stepDone : theme.stepIdle
                }`}
              >
                {isDone && !isActive ? "✓" : index + 1}
              </div>
              <span
                className={`hidden text-center text-[10px] font-bold leading-tight sm:block ${
                  isActive ? "text-white" : "text-white/45"
                }`}
              >
                {label}
              </span>
              {index < labels.length - 1 ? (
                <div
                  className={`absolute hidden h-0.5 sm:block ${theme.line}`}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
