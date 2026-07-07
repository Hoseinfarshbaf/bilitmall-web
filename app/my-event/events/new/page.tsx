"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyEventShell from "@/components/my-event/MyEventShell";
import MyEventEventForm, {
  type MyEventEventFormValues,
} from "@/components/my-event/MyEventEventForm";
import { MY_EVENT_EVENT_SUBMIT_SUCCESS_MESSAGE, MY_EVENT_SEATING_AFTER_APPROVAL_HINT, MY_EVENT_LINKED_VENUE_SEATING_HINT } from "@/lib/my-event/constants";

async function uploadEventImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "خطا در آپلود تصویر");
  return data.url as string;
}

export default function MyEventNewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hadSeating, setHadSeating] = useState(false);
  const [hadLinkedVenue, setHadLinkedVenue] = useState(false);
  const [organizerSlug, setOrganizerSlug] = useState("");

  useEffect(() => {
    fetch("/api/my-event/me").then(async (res) => {
      if (!res.ok) {
        router.replace("/my-event/login");
        return;
      }
      const data = await res.json();
      setOrganizerSlug(data.organizer?.slug ?? "");
      setAuthChecked(true);
    });
  }, [router]);

  async function handleSubmit(values: MyEventEventFormValues, imageFile: File | null) {
    setLoading(true);
    try {
      let imageUrl = values.image;
      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      const response = await fetch("/api/my-event/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, image: imageUrl }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ثبت رویداد");
      setHadSeating(values.hasAssignedSeating === true);
      setHadLinkedVenue(
        values.hasAssignedSeating === true && values.venueTemplateId != null
      );
      setSubmitted(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در ثبت رویداد");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <MyEventShell>
        <p className="text-slate-400">در حال بارگذاری...</p>
      </MyEventShell>
    );
  }

  return (
    <MyEventShell title="رویداد جدید">
      {submitted ? (
        <div className="max-w-xl space-y-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="text-xl font-black text-amber-200">رویداد ثبت شد</h2>
          <p className="text-sm text-slate-300">{MY_EVENT_EVENT_SUBMIT_SUCCESS_MESSAGE}</p>
          {hadSeating && hadLinkedVenue ? (
            <p className="text-sm leading-7 text-emerald-200">{MY_EVENT_LINKED_VENUE_SEATING_HINT}</p>
          ) : hadSeating ? (
            <p className="text-sm leading-7 text-violet-200">{MY_EVENT_SEATING_AFTER_APPROVAL_HINT}</p>
          ) : null}
          <button
            type="button"
            onClick={() => router.push("/my-event/dashboard")}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold"
          >
            بازگشت به داشبورد
          </button>
        </div>
      ) : (
        <MyEventEventForm
          organizerSlug={organizerSlug}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="ثبت و ارسال برای تأیید"
        />
      )}
    </MyEventShell>
  );
}
