"use client";

import { useEffect, useState } from "react";
import AdminBackLink from "@/components/admin/AdminBackLink";
import { adminTableClasses } from "@/components/admin/admin-table-classes";
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
    <main
      className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <AdminBackLink />
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">سفارش‌ها و پرداخت‌ها</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">تمام تراکنش‌های کاربران بلیت‌مال</p>

        <div className={`mt-8 ${adminTableClasses.panel}`}>
          {loading ? (
            <p className={adminTableClasses.emptyInPanel}>در حال بارگذاری...</p>
          ) : orders.length === 0 ? (
            <p className={adminTableClasses.emptyInPanel}>سفارشی ثبت نشده.</p>
          ) : (
            <div className={adminTableClasses.panelInner}>
              <table className={adminTableClasses.table}>
                <thead className={adminTableClasses.thead}>
                  <tr>
                    <th className={adminTableClasses.th}>کاربر</th>
                    <th className={adminTableClasses.th}>رویداد</th>
                    <th className={adminTableClasses.th}>مبلغ</th>
                    <th className={adminTableClasses.th}>وضعیت</th>
                    <th className={adminTableClasses.th}>پیگیری</th>
                    <th className={adminTableClasses.th}>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className={adminTableClasses.tr}>
                      <td className={adminTableClasses.td}>
                        <div className="font-bold">{order.user.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                          {order.user.phone}
                        </div>
                      </td>
                      <td className={adminTableClasses.td}>{order.eventTitle}</td>
                      <td className={adminTableClasses.td}>
                        {order.amount} × {order.quantity}
                      </td>
                      <td className={adminTableClasses.td}>
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </td>
                      <td className={`${adminTableClasses.td} text-xs`} dir="ltr">
                        {order.paymentRef ?? "—"}
                      </td>
                      <td
                        className={`${adminTableClasses.td} text-xs text-slate-500 dark:text-slate-400`}
                        dir="ltr"
                      >
                        {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
