"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AccountNav from "@/components/account/AccountNav";
import AccountShell from "@/components/account/AccountShell";
import { useAuth } from "@/components/AuthProvider";
import { ORDER_STATUS_LABELS } from "@/lib/bilitmall/store";
import type { UserTicketOrder } from "@/lib/bilitmall/store";

type UserProfile = {
  id: number;
  name: string;
  phone: string;
};

export default function AccountTicketsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<UserTicketOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.replace("/auth/login");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const ordersRes = await fetch("/api/account/orders");
        if (ordersRes.ok) {
          setOrders(await ordersRes.json());
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <AccountShell>
        <p className="text-neutral-500">در حال بارگذاری...</p>
      </AccountShell>
    );
  }

  if (!user) return null;

  const paidTickets = orders.filter((o) => o.status === "paid");

  return (
    <AccountShell title={`سلام، ${user.name}`}>
      <AccountNav />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500" dir="ltr">
          {user.phone}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100"
        >
          خروج
        </button>
      </div>

      <h2 className="mb-4 text-xl font-black">بلیت‌های خریداری‌شده</h2>

      {paidTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-neutral-500">هنوز بلیتی خریداری نکرده‌اید.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white"
          >
            مشاهده رویدادها
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paidTickets.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-neutral-900">{order.eventTitle}</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {order.sessionDate && order.sessionTime
                      ? `${order.sessionDate} — ساعت ${order.sessionTime}`
                      : "زمان سانس مشخص نشده"}
                  </p>
                  <p className="mt-2 text-sm font-bold text-neutral-700">
                    {order.quantity} بلیت — {order.amount}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              {order.paymentRef ? (
                <p className="mt-3 text-xs text-neutral-400" dir="ltr">
                  کد پیگیری: {order.paymentRef}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
