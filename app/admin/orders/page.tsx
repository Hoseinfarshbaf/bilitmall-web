"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ORDER_STATUS_LABELS } from "@/lib/bilitmall/store";

type OrderRow = {
  id: number;
  eventTitle: string;
  amount: string;
  quantity: number;
  status: string;
  paymentRef: string | null;
  paymentMethod: string;
  createdAt: string;
  user: { id: number; name: string; phone: string };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="mb-4 inline-block text-sm font-bold text-blue-600">
          ← بازگشت به پنل
        </Link>
        <h1 className="text-3xl font-black text-slate-800">سفارش‌ها و پرداخت‌ها</h1>
        <p className="mt-2 text-sm text-slate-500">تمام تراکنش‌های کاربران بلیت‌مال</p>

        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-slate-500">در حال بارگذاری...</p>
          ) : orders.length === 0 ? (
            <p className="p-8 text-center text-slate-500">سفارشی ثبت نشده.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-right font-bold">کاربر</th>
                  <th className="px-4 py-3 text-right font-bold">رویداد</th>
                  <th className="px-4 py-3 text-right font-bold">مبلغ</th>
                  <th className="px-4 py-3 text-right font-bold">وضعیت</th>
                  <th className="px-4 py-3 text-right font-bold">پیگیری</th>
                  <th className="px-4 py-3 text-right font-bold">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-4 py-4">
                      <div className="font-bold">{order.user.name}</div>
                      <div className="text-xs text-slate-500" dir="ltr">
                        {order.user.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4">{order.eventTitle}</td>
                    <td className="px-4 py-4">
                      {order.amount} × {order.quantity}
                    </td>
                    <td className="px-4 py-4">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </td>
                    <td className="px-4 py-4 text-xs" dir="ltr">
                      {order.paymentRef ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500" dir="ltr">
                      {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
