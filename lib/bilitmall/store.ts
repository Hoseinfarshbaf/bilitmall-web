import { prisma } from "@/lib/prisma";

export type BilitmallUserProfile = {
  id: number;
  phone: string;
  name: string;
  email: string | null;
  createdAt: string;
};

export type UserTicketOrder = {
  id: number;
  eventId: number;
  eventTitle: string;
  eventSlug: string;
  amount: string;
  quantity: number;
  sessionDate: string | null;
  sessionTime: string | null;
  status: string;
  paymentRef: string | null;
  paymentMethod: string;
  createdAt: string;
};

export async function getBilitmallUserByPhone(phone: string) {
  return prisma.bilitmallUser.findUnique({ where: { phone } });
}

export async function getBilitmallUserById(id: number) {
  return prisma.bilitmallUser.findUnique({ where: { id } });
}

export async function getBilitmallUserProfile(
  userId: number
): Promise<BilitmallUserProfile | null> {
  const user = await prisma.bilitmallUser.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getUserOrders(userId: number): Promise<UserTicketOrder[]> {
  const orders = await prisma.ticketOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    id: order.id,
    eventId: order.eventId,
    eventTitle: order.eventTitle,
    eventSlug: order.eventSlug,
    amount: order.amount,
    quantity: order.quantity,
    sessionDate: order.sessionDate,
    sessionTime: order.sessionTime,
    status: order.status,
    paymentRef: order.paymentRef,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
  }));
}

export async function listBilitmallUsersForAdmin() {
  const users = await prisma.bilitmallUser.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return users.map((user) => ({
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    orderCount: user._count.orders,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function listAllOrdersForAdmin() {
  const orders = await prisma.ticketOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    eventId: order.eventId,
    eventTitle: order.eventTitle,
    eventSlug: order.eventSlug,
    amount: order.amount,
    quantity: order.quantity,
    status: order.status,
    paymentRef: order.paymentRef,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    user: order.user,
  }));
}

export async function updateBilitmallUserForAdmin(
  id: number,
  data: { name?: string; email?: string | null }
) {
  return prisma.bilitmallUser.update({ where: { id }, data });
}

export async function deleteBilitmallUserForAdmin(id: number) {
  return prisma.bilitmallUser.delete({ where: { id } });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  refunded: "استرداد شده",
};
