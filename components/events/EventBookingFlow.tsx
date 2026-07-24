"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import {
  useEventPageTheme,
  type BookingFlowTheme,
  type EventPageVariant,
} from "@/lib/events/event-page-theme";
import type { SeatingLayout } from "@/lib/seating/types";
import SeatingPlanPicker from "@/components/events/SeatingPlanPicker";
import { cn } from "@/lib/utils";

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
  variant?: EventPageVariant;
};

function formatToman(toman: number): string {
  return `${toman.toLocaleString("en-US")} تومان`;
}

/**
 * دو مسیر خرید بلیت‌مال:
 * 1) EXTERNAL_LINK — رویدادهایی مثل هنرتیکت: زمان/مکان → لینک سایت فروشنده
 * 2) INTERNAL — ثبت‌شده توسط برگزارکننده در بلیت‌مال: زمان → (نقشه صندلی) → پرداخت
 */
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
  const { booking: theme } = useEventPageTheme(variant);
  const router = useRouter();
  const pathname = usePathname();

  const [step, setStep] = useState<FlowStep>("schedule");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [seatingLayout, setSeatingLayout] = useState<SeatingLayout | null>(null);
  const [seatingLoading, setSeatingLoading] = useState(false);
  const [seatingError, setSeatingError] = useState("");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [ticketRef, setTicketRef] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const selectedDay = schedule[selectedDayIndex];
  const selectedSession = selectedDay?.sessions[selectedSessionIndex];

  /** فقط کانال فروش تعیین می‌کند — نه وجود purchaseUrl روی سانس. */
  const isExternalFlow = ticketingType === "EXTERNAL_LINK";
  const isInternalSeated = !isExternalFlow && hasAssignedSeating;

  const stepLabels = useMemo(() => {
    if (isExternalFlow) return ["انتخاب زمان", "رفتن به خرید"];
    if (isInternalSeated) {
      return ["انتخاب زمان", "انتخاب صندلی", "پرداخت", "دریافت بلیت"];
    }
    return ["انتخاب زمان", "پرداخت", "دریافت بلیت"];
  }, [isExternalFlow, isInternalSeated]);

  const stepIndex = useMemo(() => {
    if (step === "schedule") return 0;
    if (step === "seats") return 1;
    if (step === "payment" || step === "external") {
      return isExternalFlow ? 1 : isInternalSeated ? 2 : 1;
    }
    return stepLabels.length - 1;
  }, [step, isExternalFlow, isInternalSeated, stepLabels.length]);

  const dayLabel = selectedDay ? formatPersianDateLong(selectedDay.date) : "";

  const selectedSeats = useMemo(() => {
    if (!seatingLayout) return [];
    const set = new Set(selectedSeatIds);
    return seatingLayout.cells.filter((c) => set.has(c.id) && c.type === "seat");
  }, [seatingLayout, selectedSeatIds]);

  const selectedSeatsTotal = useMemo(
    () => selectedSeats.reduce((sum, c) => sum + c.priceRial, 0),
    [selectedSeats]
  );

  const seatLabelsText = useMemo(
    () => selectedSeats.map((c) => c.label || c.id).join("، "),
    [selectedSeats]
  );

  const quantity = isInternalSeated ? selectedSeatIds.length || 0 : 1;
  const displayAmount =
    isInternalSeated && selectedSeatsTotal > 0
      ? formatToman(selectedSeatsTotal)
      : eventPrice;

  useEffect(() => {
    if (step !== "seats" || !isInternalSeated) return;
    if (seatingLayout) return;

    let cancelled = false;
    setSeatingLoading(true);
    setSeatingError("");

    void fetch(`/api/events/${eventId}/seating-plan`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSeatingError(data.error || "بارگذاری نقشه سالن ناموفق بود.");
          return;
        }
        if (data.hasSeatingPlan && data.layout) {
          setSeatingLayout(data.layout as SeatingLayout);
          setSeatingError("");
        } else {
          setSeatingError(
            "نقشه سالن هنوز برای این رویداد آماده نشده است. لطفاً بعداً دوباره تلاش کنید."
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeatingError("خطا در بارگذاری نقشه سالن.");
        }
      })
      .finally(() => {
        if (!cancelled) setSeatingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, eventId, isInternalSeated, seatingLayout]);

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
    if (isInternalSeated) {
      setSeatingLayout(null);
      setSelectedSeatIds([]);
      setSeatingError("");
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
    setPayError("");
    try {
      const res = await fetch(`/api/events/${eventId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate: selectedDay?.date,
          sessionTime: selectedSession?.time,
          seatIds: isInternalSeated ? selectedSeatIds : [],
        }),
      });
      const data = await res.json();

      if (res.status === 401 && data.code === "AUTH_REQUIRED") {
        const next = encodeURIComponent(pathname || "/");
        router.push(`/auth/login?next=${next}`);
        return;
      }

      if (!res.ok) {
        setPayError(data.error || "پرداخت انجام نشد.");
        return;
      }

      setTicketRef(data.paymentRef || `BM-${eventId}`);
      setStep("success");
    } catch {
      setPayError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setPaying(false);
    }
  }

  if (unavailable) {
    return (
      <div className={theme.unavailablePanel}>
        <div className="mb-4 flex items-center gap-2">
          <Ticket className={cn("h-5 w-5", theme.sectionIcon)} />
          <h2 className={cn("text-lg font-black", theme.sectionTitle)}>خرید بلیط</h2>
        </div>
        <div className={theme.unavailableBox}>{unavailableMessage}</div>
      </div>
    );
  }

  if (schedule.length === 0) return null;

  return (
    <div className={theme.panel}>
      <StepIndicator
        labels={stepLabels}
        currentIndex={stepIndex}
        theme={theme}
        done={step === "success"}
      />

      <div className="p-5 sm:p-6">
        {step === "schedule" ? (
          <div className="space-y-6">
            <SectionTitle icon={CalendarDays} title="روز برگزاری" theme={theme} />
            <div className="flex flex-wrap gap-2">
              {schedule.map((day, index) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    setSelectedDayIndex(index);
                    setSelectedSessionIndex(0);
                  }}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-bold transition",
                    selectedDayIndex === index ? theme.chipActive : theme.chipIdle
                  )}
                >
                  {formatPersianDateLong(day.date)}
                </button>
              ))}
            </div>

            {selectedDay && selectedDay.sessions.length > 0 ? (
              <>
                <SectionTitle icon={Clock} title={`سانس — ${dayLabel}`} theme={theme} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedDay.sessions.map((session, index) => (
                    <button
                      key={`${selectedDay.date}-${session.time}-${index}`}
                      type="button"
                      onClick={() => setSelectedSessionIndex(index)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-center transition",
                        selectedSessionIndex === index ? theme.chipActive : theme.chipIdle
                      )}
                    >
                      <div className="text-lg font-black">{session.time}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <SummaryCard
              theme={theme}
              lines={[
                { label: "روز", value: dayLabel },
                { label: "سانس", value: selectedSession?.time ?? "—" },
                { label: "مکان", value: `${place} — ${city}` },
              ]}
            />

            <button
              type="button"
              onClick={goAfterSchedule}
              className={cn(
                "w-full rounded-2xl py-4 text-base font-black text-white transition",
                theme.btn
              )}
            >
              ادامه
            </button>
          </div>
        ) : null}

        {step === "seats" ? (
          <div className="space-y-5">
            <SectionTitle icon={MapPin} title="انتخاب صندلی از نقشه سالن" theme={theme} />
            <p className={cn("text-sm leading-6", theme.mutedText)}>
              صندلی‌های مورد نظر را روی نقشه انتخاب کنید، سپس به پرداخت بروید.
            </p>
            {seatingLoading ? (
              <p className={cn("py-8 text-center text-sm", theme.mutedText)}>
                در حال بارگذاری نقشه سالن...
              </p>
            ) : seatingLayout ? (
              <SeatingPlanPicker
                layout={seatingLayout}
                selectedIds={selectedSeatIds}
                onToggleSeat={(id) => toggleSeat(id)}
                variant={variant}
              />
            ) : (
              <p className={cn("rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800", theme.mutedText)}>
                {seatingError || "نقشه سالن در دسترس نیست."}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className={theme.ghostBtn}
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={selectedSeatIds.length === 0 || !seatingLayout}
                onClick={() => {
                  setPayError("");
                  setStep("payment");
                }}
                className={cn(
                  "flex-1 rounded-2xl py-3 text-sm font-black text-white disabled:opacity-40",
                  theme.btn
                )}
              >
                ادامه به پرداخت
              </button>
            </div>
          </div>
        ) : null}

        {step === "external" ? (
          <div className="space-y-6">
            <SectionTitle icon={ExternalLink} title="خرید از سایت فروشنده" theme={theme} />
            <p className={cn("text-sm leading-7", theme.mutedText)}>
              فروش بلیت این رویداد خارج از بلیت‌مال و از طریق سایت اصلی برگزارکننده (مثل
              هنرتیکت و مشابه) انجام می‌شود. زمان و محل را یادداشت کنید و برای تکمیل خرید به
              صفحه فروشنده بروید.
            </p>
            <SummaryCard
              theme={theme}
              lines={[
                { label: "رویداد", value: eventTitle },
                { label: "روز", value: dayLabel },
                { label: "سانس", value: selectedSession?.time ?? "—" },
                { label: "مکان", value: `${place} — ${city}` },
              ]}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className={theme.ghostBtn}
              >
                قبلی
              </button>
              <button
                type="button"
                onClick={openExternalLink}
                disabled={!selectedSession?.purchaseUrl?.trim()}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white disabled:opacity-40",
                  theme.btn
                )}
              >
                <ExternalLink className="h-5 w-5" />
                رفتن به صفحه خرید
              </button>
            </div>
            {!selectedSession?.purchaseUrl?.trim() ? (
              <p className="text-center text-xs text-amber-700">
                لینک خرید این سانس هنوز ثبت نشده است.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="space-y-6">
            <SectionTitle icon={CreditCard} title="پرداخت در بلیت‌مال" theme={theme} />
            <SummaryCard
              theme={theme}
              lines={[
                { label: "رویداد", value: eventTitle },
                { label: "روز", value: dayLabel },
                { label: "سانس", value: selectedSession?.time ?? "—" },
                {
                  label: "جایگاه",
                  value: isInternalSeated
                    ? seatLabelsText || `${selectedSeatIds.length} صندلی`
                    : "بدون صندلی ثابت",
                },
                { label: "مبلغ", value: displayAmount },
                {
                  label: "تعداد",
                  value: String(quantity || 1),
                },
              ]}
            />
            <p className={theme.infoBox}>
              پرداخت آنلاین امن — پس از تأیید، بلیت الکترونیکی در حساب شما ثبت می‌شود.
            </p>
            {payError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {payError}
              </p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setStep(isInternalSeated && seatingLayout ? "seats" : "schedule")
                }
                className={theme.ghostBtn}
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={paying || (isInternalSeated && selectedSeatIds.length === 0)}
                onClick={handlePayment}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white disabled:opacity-60",
                  theme.btn
                )}
              >
                <CreditCard className="h-5 w-5" />
                {paying ? "در حال پردازش..." : "پرداخت و دریافت بلیت"}
              </button>
            </div>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="space-y-6 py-4 text-center">
            <CheckCircle2 className={cn("mx-auto h-16 w-16", theme.successIcon)} />
            <h2 className={cn("text-xl font-black", theme.sectionTitle)}>بلیت شما صادر شد</h2>
            <p className={cn("text-sm", theme.successSubtitle)}>
              {dayLabel} — سانس {selectedSession?.time}
              {seatLabelsText ? ` — ${seatLabelsText}` : ""}
            </p>
            <div className={theme.successCard}>
              <p className={theme.successCodeLabel}>کد پیگیری</p>
              <p className="mt-2 font-mono text-2xl font-black tracking-wider" dir="ltr">
                {ticketRef}
              </p>
            </div>
            <p className={cn("text-xs", theme.successFootnote)}>
              این خرید در بخش «پرداخت‌ها» حساب بلیت‌مال شما قابل مشاهده است.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep("schedule");
                setSelectedSeatIds([]);
                setTicketRef("");
                setPayError("");
              }}
              className={cn("rounded-2xl px-6 py-3 text-sm font-bold text-white", theme.btn)}
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
  theme,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  theme: BookingFlowTheme;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", theme.sectionIcon)} />
      <h3 className={cn("text-sm font-black", theme.sectionTitle)}>{title}</h3>
    </div>
  );
}

function SummaryCard({
  lines,
  theme,
}: {
  lines: { label: string; value: string }[];
  theme: BookingFlowTheme;
}) {
  return (
    <div className={theme.summaryCard}>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-4 text-sm">
            <span className={theme.summaryLabel}>{line.label}</span>
            <span className={theme.summaryValue}>{line.value}</span>
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
  theme: BookingFlowTheme;
  done: boolean;
}) {
  return (
    <div className={cn("px-4 py-4 sm:px-6", theme.panelHeader)}>
      <div className="flex items-center justify-between gap-1">
        {labels.map((label, index) => {
          const isActive = !done && index === currentIndex;
          const isDone = done || index < currentIndex;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition",
                  isActive ? theme.stepActive : isDone ? theme.stepDone : theme.stepIdle
                )}
              >
                {isDone && !isActive ? "✓" : index + 1}
              </div>
              <span
                className={cn(
                  "hidden text-center text-[10px] font-bold leading-tight sm:block",
                  isActive ? theme.stepLabelActive : theme.stepLabelIdle
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
