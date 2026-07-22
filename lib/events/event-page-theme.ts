import { useTheme } from "@/components/ThemeProvider";

export type EventPageVariant = "bilitmall" | "organizer";

export type BookingFlowTheme = {
  chipActive: string;
  chipIdle: string;
  btn: string;
  stepActive: string;
  stepDone: string;
  stepIdle: string;
  line: string;
  panel: string;
  panelHeader: string;
  sectionIcon: string;
  sectionTitle: string;
  summaryCard: string;
  summaryLabel: string;
  summaryValue: string;
  mutedText: string;
  ghostBtn: string;
  infoBox: string;
  successCard: string;
  successCodeLabel: string;
  stepLabelActive: string;
  stepLabelIdle: string;
  unavailablePanel: string;
  unavailableBox: string;
  successIcon: string;
  successSubtitle: string;
  successFootnote: string;
};

const bookingThemes: Record<"light" | "dark", Record<EventPageVariant, BookingFlowTheme>> = {
  light: {
    bilitmall: {
      chipActive:
        "border-brand-500 bg-brand-50 text-brand-700 shadow-md shadow-brand-500/10",
      chipIdle:
        "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-brand-300 hover:bg-brand-50/60",
      btn: "bg-brand-500 hover:bg-brand-400",
      stepActive: "bg-brand-500 text-white",
      stepDone: "bg-brand-100 text-brand-700",
      stepIdle: "bg-neutral-100 text-neutral-400",
      line: "bg-brand-200",
      panel:
        "overflow-hidden rounded-3xl border border-neutral-200 bg-white/95 shadow-xl backdrop-blur-md",
      panelHeader: "border-b border-neutral-200 bg-neutral-50/90",
      sectionIcon: "text-brand-500",
      sectionTitle: "text-neutral-800",
      summaryCard: "rounded-2xl border border-neutral-200 bg-neutral-50 p-4",
      summaryLabel: "text-neutral-500",
      summaryValue: "font-bold text-neutral-900",
      mutedText: "text-neutral-600",
      ghostBtn:
        "rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50",
      infoBox:
        "rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600",
      successCard: "rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5",
      successCodeLabel: "text-xs text-neutral-500",
      stepLabelActive: "text-neutral-900",
      stepLabelIdle: "text-neutral-400",
      unavailablePanel:
        "rounded-3xl border border-neutral-200 bg-white/95 p-6 shadow-xl backdrop-blur-md",
      unavailableBox:
        "rounded-2xl bg-neutral-100 py-8 text-center text-base font-black text-neutral-600",
      successIcon: "text-brand-500",
      successSubtitle: "text-neutral-600",
      successFootnote: "text-neutral-500",
    },
    organizer: {
      chipActive:
        "border-brand-500 bg-brand-50 text-brand-800 shadow-md shadow-brand-500/10",
      chipIdle:
        "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-brand-300 hover:bg-brand-50/60",
      btn: "bg-brand-600 hover:bg-brand-500",
      stepActive: "bg-brand-600 text-white",
      stepDone: "bg-brand-100 text-brand-800",
      stepIdle: "bg-neutral-100 text-neutral-400",
      line: "bg-brand-200",
      panel:
        "overflow-hidden rounded-3xl border border-neutral-200 bg-white/95 shadow-xl backdrop-blur-md",
      panelHeader: "border-b border-neutral-200 bg-neutral-50/90",
      sectionIcon: "text-brand-600",
      sectionTitle: "text-neutral-800",
      summaryCard: "rounded-2xl border border-neutral-200 bg-neutral-50 p-4",
      summaryLabel: "text-neutral-500",
      summaryValue: "font-bold text-neutral-900",
      mutedText: "text-neutral-600",
      ghostBtn:
        "rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50",
      infoBox:
        "rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600",
      successCard: "rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5",
      successCodeLabel: "text-xs text-neutral-500",
      stepLabelActive: "text-neutral-900",
      stepLabelIdle: "text-neutral-400",
      unavailablePanel:
        "rounded-3xl border border-neutral-200 bg-white/95 p-6 shadow-xl backdrop-blur-md",
      unavailableBox:
        "rounded-2xl bg-neutral-100 py-8 text-center text-base font-black text-neutral-600",
      successIcon: "text-brand-500",
      successSubtitle: "text-neutral-600",
      successFootnote: "text-neutral-500",
    },
  },
  dark: {
    bilitmall: {
      chipActive:
        "border-brand-400 bg-brand-500/25 text-white shadow-lg shadow-brand-500/20",
      chipIdle: "border-white/15 bg-white/10 text-white/85 hover:border-brand-400/40",
      btn: "bg-brand-500 hover:bg-brand-400",
      stepActive: "bg-brand-500 text-white",
      stepDone: "bg-brand-500/30 text-brand-200",
      stepIdle: "bg-white/10 text-white/50",
      line: "bg-brand-500/40",
      panel:
        "overflow-hidden rounded-3xl border border-white/10 bg-black/45 shadow-2xl backdrop-blur-md",
      panelHeader: "border-b border-white/10 bg-black/30",
      sectionIcon: "text-white/70",
      sectionTitle: "text-white/90",
      summaryCard: "rounded-2xl border border-white/10 bg-white/5 p-4",
      summaryLabel: "text-white/50",
      summaryValue: "font-bold text-white/90",
      mutedText: "text-white/75",
      ghostBtn:
        "rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/5",
      infoBox:
        "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/55",
      successCard: "rounded-2xl border border-white/15 bg-white/10 px-6 py-5",
      successCodeLabel: "text-xs text-white/50",
      stepLabelActive: "text-white",
      stepLabelIdle: "text-white/45",
      unavailablePanel:
        "rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md",
      unavailableBox:
        "rounded-2xl bg-white/10 py-8 text-center text-base font-black text-white/70",
      successIcon: "text-brand-400",
      successSubtitle: "text-white/70",
      successFootnote: "text-white/45",
    },
    organizer: {
      chipActive:
        "border-brand-400 bg-brand-500/25 text-white shadow-lg shadow-brand-500/20",
      chipIdle: "border-white/15 bg-white/10 text-white/85 hover:border-brand-400/40",
      btn: "bg-brand-600 hover:bg-brand-500",
      stepActive: "bg-brand-500 text-white",
      stepDone: "bg-brand-500/30 text-brand-200",
      stepIdle: "bg-white/10 text-white/50",
      line: "bg-brand-500/40",
      panel:
        "overflow-hidden rounded-3xl border border-white/10 bg-black/45 shadow-2xl backdrop-blur-md",
      panelHeader: "border-b border-white/10 bg-black/30",
      sectionIcon: "text-white/70",
      sectionTitle: "text-white/90",
      summaryCard: "rounded-2xl border border-white/10 bg-white/5 p-4",
      summaryLabel: "text-white/50",
      summaryValue: "font-bold text-white/90",
      mutedText: "text-white/75",
      ghostBtn:
        "rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/5",
      infoBox:
        "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/55",
      successCard: "rounded-2xl border border-white/15 bg-white/10 px-6 py-5",
      successCodeLabel: "text-xs text-white/50",
      stepLabelActive: "text-white",
      stepLabelIdle: "text-white/45",
      unavailablePanel:
        "rounded-3xl border border-brand-500/20 bg-black/40 p-6 backdrop-blur-md",
      unavailableBox:
        "rounded-2xl bg-white/10 py-8 text-center text-base font-black text-white/70",
      successIcon: "text-brand-400",
      successSubtitle: "text-white/70",
      successFootnote: "text-white/45",
    },
  },
};

export function useEventPageTheme(variant: EventPageVariant = "bilitmall") {
  const { theme } = useTheme();
  // Organizer public pages stay light and ignore marketplace preference.
  const isDark = variant === "organizer" ? false : theme === "dark";
  const mode = isDark ? "dark" : "light";
  return {
    isDark,
    theme: mode,
    variant,
    booking: bookingThemes[mode][variant],
    accentText:
      variant === "bilitmall"
        ? isDark
          ? "text-brand-400"
          : "text-brand-600"
        : isDark
          ? "text-brand-400"
          : "text-brand-600",
    accentIcon:
      variant === "bilitmall"
        ? isDark
          ? "text-brand-400"
          : "text-brand-500"
        : isDark
          ? "text-brand-400"
          : "text-brand-500",
    heroCard: isDark
      ? "border-white/10 bg-black/45"
      : "border-neutral-200/80 bg-white/90",
    surfaceCard: isDark
      ? "rounded-2xl border border-white/10 bg-black/35 backdrop-blur-sm"
      : "rounded-2xl border border-neutral-200 bg-white/85 backdrop-blur-sm shadow-sm",
    backBtn: isDark
      ? "border-white/15 bg-black/30 text-white/90 hover:bg-black/50"
      : "border-neutral-200 bg-white/80 text-neutral-700 hover:bg-white shadow-sm",
    mutedText: isDark ? "text-white/70" : "text-neutral-600",
    subtleText: isDark ? "text-white/55" : "text-neutral-500",
    titleText: isDark ? "text-white" : "text-neutral-900",
    chipActiveOrganizer: isDark
      ? "bg-brand-600 text-white"
      : "bg-brand-600 text-white",
    chipIdleOrganizer: isDark
      ? "border border-white/15 bg-black/30 text-white/80 hover:bg-black/50"
      : "border border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:bg-brand-50",
    footerMuted: isDark ? "text-white/30" : "text-neutral-400",
  };
}
