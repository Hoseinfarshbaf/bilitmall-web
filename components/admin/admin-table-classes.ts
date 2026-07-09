export const adminTableClasses = {
  panel:
    "overflow-hidden rounded-3xl border border-slate-200 bg-slate-100/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/90",
  panelInner: "overflow-x-auto p-3",
  table: "min-w-full border-separate border-spacing-y-3 text-sm",
  thead: "text-slate-500 dark:text-slate-400",
  th: "px-4 pb-2 pt-1 text-right text-[11px] font-black tracking-wide text-slate-500 dark:text-slate-400",
  tr: "bg-white shadow-sm ring-1 ring-slate-200/90 transition hover:shadow-md hover:ring-slate-300 dark:bg-slate-900 dark:ring-slate-700/90 dark:hover:ring-slate-600",
  td: "bg-inherit px-4 py-4 align-middle first:rounded-r-2xl last:rounded-l-2xl",
  tdTop: "bg-inherit px-4 py-4 align-top first:rounded-r-2xl last:rounded-l-2xl",
  tdAccent:
    "border-r-[3px] border-r-blue-500/60 dark:border-r-blue-400/50",
  emptyInPanel: "p-8 text-center text-slate-500 dark:text-slate-400",
} as const;
