"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AccountNav from "@/components/account/AccountNav";
import AccountShell from "@/components/account/AccountShell";
import { ORDER_STATUS_LABELS } from "@/lib/bilitmall/store";
import type { UserTicketOrder } from "@/lib/bilitmall/store";

export default function AccountPaymentsPage() {
  const router = useRouter();
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

  if (loading) {
    return (
      <AccountShell title="پرداخت‌ها">
        <p className="text-neutral-500">در حال بارگذاری...</p>
      </AccountShell>
    );
  }

  return (
    <AccountShell title="پرداخت‌ها">
      <AccountNav />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
          تراکنشی ثبت نشده است.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 text-right font-bold">رویداد</th>
                <th className="px-4 py-3 text-right font-bold">مبلغ</th>
                <th className="px-4 py-3 text-right font-bold">وضعیت</th>
                <th className="px-4 py-3 text-right font-bold">روش</th>
                <th className="px-4 py-3 text-right font-bold">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-neutral-100">
                  <td className="px-4 py-4 font-bold">{order.eventTitle}</td>
                  <td className="px-4 py-4">{order.amount}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">{order.paymentMethod}</td>
                  <td className="px-4 py-4 text-xs text-neutral-500" dir="ltr">
                    {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountShell>
  );
}
