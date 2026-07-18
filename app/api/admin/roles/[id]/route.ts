import { NextResponse } from "next/server";
import { deleteRole, updateRole } from "@/lib/admin/directory";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
    };
    const role = await updateRole(id, body);
    return NextResponse.json(role);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا";
    const status = message.includes("یافت نشد") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const id = Number((await context.params).id);
  if (!id) {
    return NextResponse.json({ error: "شناسه نامعتبر است." }, { status: 400 });
  }

  try {
    await deleteRole(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا";
    const status = message.includes("یافت نشد") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
