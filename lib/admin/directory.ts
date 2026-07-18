import { prisma } from "@/lib/prisma";
import type { RoleSummary } from "@/lib/bilitmall/roles";
import { slugifyRoleName, SYSTEM_ROLE_SLUGS } from "@/lib/bilitmall/roles";

export type DirectorySource = "bilitmall" | "my_event";

export type DirectoryRow = {
  source: DirectorySource;
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: RoleSummary;
  orderCount?: number;
  organizerDisplayName?: string;
  organizerStatus?: string;
  organizerId?: number;
  createdAt: string;
};

function mapRole(role: {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}): RoleSummary {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
  };
}

export async function ensureSystemRoles() {
  const existingCount = await prisma.role.count();
  if (existingCount > 0) return;

  await prisma.role.createMany({
    data: [
      {
        slug: SYSTEM_ROLE_SLUGS.user,
        name: "کاربر بلیت‌مال",
        description: "خریدار عادی سایت بلیت‌مال",
        isSystem: true,
      },
      {
        slug: SYSTEM_ROLE_SLUGS.manager,
        name: "مدیر",
        description: "مدیر داخلی بلیت‌مال",
        isSystem: true,
      },
      {
        slug: SYSTEM_ROLE_SLUGS.admin,
        name: "ادمین",
        description: "دسترسی کامل پنل ادمین",
        isSystem: true,
      },
      {
        slug: SYSTEM_ROLE_SLUGS.organizer,
        name: "برگزارکننده",
        description: "برگزارکننده رویداد (شامل حساب My Event)",
        isSystem: true,
      },
    ],
  });
}

export async function getRoleIdBySlug(slug: string): Promise<number> {
  const role = await prisma.role.findUnique({ where: { slug } });
  if (!role) throw new Error(`نقش «${slug}» یافت نشد.`);
  return role.id;
}

export async function listRoles(): Promise<RoleSummary[]> {
  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
  return roles.map(mapRole);
}

export async function createRole(input: {
  name: string;
  description?: string | null;
  slug?: string;
}): Promise<RoleSummary> {
  const name = input.name.trim();
  if (!name) throw new Error("نام نقش الزامی است.");

  let slug = (input.slug?.trim() || slugifyRoleName(name)).toLowerCase();
  if (!slug) slug = slugifyRoleName(name);

  const existing = await prisma.role.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const role = await prisma.role.create({
    data: {
      name,
      slug,
      description: input.description?.trim() || null,
      isSystem: false,
    },
  });
  return mapRole(role);
}

export async function updateRole(
  id: number,
  input: { name?: string; description?: string | null }
): Promise<RoleSummary> {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new Error("نقش یافت نشد.");

  const data: { name?: string; description?: string | null } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("نام نقش الزامی است.");
    data.name = name;
  }
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  const updated = await prisma.role.update({ where: { id }, data });
  return mapRole(updated);
}

export async function deleteRole(id: number): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: { select: { bilitmallUsers: true, myEventUsers: true } },
    },
  });
  if (!role) throw new Error("نقش یافت نشد.");

  const inUse = role._count.bilitmallUsers + role._count.myEventUsers;
  if (inUse > 0) {
    throw new Error("این نقش به کاربرانی اختصاص داده شده و قابل حذف نیست.");
  }

  await prisma.role.delete({ where: { id } });
}

export async function listDirectoryAccounts(): Promise<DirectoryRow[]> {
  const [bilitmallUsers, myEventUsers] = await Promise.all([
    prisma.bilitmallUser.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        role: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.myEventUser.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        role: true,
        myEventOrganizer: {
          select: { id: true, displayName: true, status: true, email: true },
        },
      },
    }),
  ]);

  const rows: DirectoryRow[] = [
    ...bilitmallUsers.map((user) => ({
      source: "bilitmall" as const,
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: mapRole(user.role),
      orderCount: user._count.orders,
      createdAt: user.createdAt.toISOString(),
    })),
    ...myEventUsers.map((user) => ({
      source: "my_event" as const,
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.myEventOrganizer.email,
      role: mapRole(user.role),
      organizerDisplayName: user.myEventOrganizer.displayName,
      organizerStatus: user.myEventOrganizer.status,
      organizerId: user.myEventOrganizer.id,
      createdAt: user.createdAt.toISOString(),
    })),
  ];

  rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return rows;
}

export async function updateDirectoryRole(input: {
  source: DirectorySource;
  id: number;
  roleId: number;
}): Promise<DirectoryRow> {
  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) throw new Error("نقش یافت نشد.");

  if (input.source === "bilitmall") {
    const user = await prisma.bilitmallUser.update({
      where: { id: input.id },
      data: { roleId: input.roleId },
      include: {
        role: true,
        _count: { select: { orders: true } },
      },
    });
    return {
      source: "bilitmall",
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: mapRole(user.role),
      orderCount: user._count.orders,
      createdAt: user.createdAt.toISOString(),
    };
  }

  const user = await prisma.myEventUser.update({
    where: { id: input.id },
    data: { roleId: input.roleId },
    include: {
      role: true,
      myEventOrganizer: {
        select: { id: true, displayName: true, status: true, email: true },
      },
    },
  });

  return {
    source: "my_event",
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.myEventOrganizer.email,
    role: mapRole(user.role),
    organizerDisplayName: user.myEventOrganizer.displayName,
    organizerStatus: user.myEventOrganizer.status,
    organizerId: user.myEventOrganizer.id,
    createdAt: user.createdAt.toISOString(),
  };
}
