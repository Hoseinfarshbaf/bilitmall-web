"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MyEventEventForm, {
  type MyEventEventFormValues,
} from "@/components/my-event/MyEventEventForm";
import MyEventShell from "@/components/my-event/MyEventShell";
import type { EventDay } from "@/lib/events/types";

async function uploadEventImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "خطا در آپلود تصویر");
  return data.url as string;
}

export default function MyEventEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState<number | null>(null);
  const [organizerSlug, setOrganizerSlug] = useState("");
  const [initialValues, setInitialValues] = useState<Partial<MyEventEventFormValues> | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [eventApproved, setEventApproved] = useState(false);
  const [hasSeatingPlan, setHasSeatingPlan] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { id } = await params;
      const numId = Number(id);
      setEventId(numId);

      const [meRes, eventRes] = await Promise.all([
        fetch("/api/my-event/me"),
        fetch(`/api/my-event/events/${numId}`),
      ]);

      if (!meRes.ok || !eventRes.ok) {
        router.replace("/my-event/dashboard");
        return;
      }

      const meData = await meRes.json();
      const data = await eventRes.json();
      setOrganizerSlug(meData.organizer?.slug ?? "");
      setEventApproved(data.status === "active" && data.published === true);
      setHasSeatingPlan(data.hasSeatingPlan === true);
      setInitialValues({
        title: data.title,
        publicEventSlug: data.publicEventSlug ?? "",
        city: data.city,
        category: data.category,
        place: data.place,
        venueTemplateId: data.venueTemplateId ?? null,
        placeAddress: data.placeAddress ?? "",
        price: data.price,
        description: data.description ?? "",
        image: data.image ?? "",
        days: data.days as EventDay[],
        hasAssignedSeating: data.hasAssignedSeating,
        listOnBilitmall: data.listOnBilitmall,
      });
      setPageLoading(false);
    }

    void load();
  }, [params, router]);

  async function handleSubmit(values: MyEventEventFormValues, imageFile: File | null) {
    if (!eventId) return;

    setLoading(true);
    setMessage("");
    try {
      let imageUrl = values.image;
      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile);
      }

      const response = await fetch(`/api/my-event/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, image: imageUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "خطا در ذخیره");
      setMessage(data.message ?? "ذخیره شد.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "خطا در ذخیره");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <MyEventShell>
        <p className="text-slate-400">در حال بارگذاری...</p>
      </MyEventShell>
    );
  }

  return (
    <MyEventShell title="ویرایش رویداد">
      {message ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {message}
        </p>
      ) : null}
      <MyEventEventForm
        organizerSlug={organizerSlug}
        eventId={eventId ?? undefined}
        eventApproved={eventApproved}
        hasSeatingPlan={hasSeatingPlan}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="ذخیره تغییرات"
        isEdit
      />
      <button
        type="button"
        onClick={() => router.push("/my-event/dashboard")}
        className="mt-4 text-sm font-bold text-slate-400 hover:text-white"
      >
        بازگشت به داشبورد
      </button>
    </MyEventShell>
  );
}
