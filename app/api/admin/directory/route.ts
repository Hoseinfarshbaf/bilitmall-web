import { NextResponse } from "next/server";
import { updateDirectoryRole, type DirectorySource } from "@/lib/admin/directory";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      source?: DirectorySource;
      id?: number;
      roleId?: number;
    };

    if (body.source !== "bilitmall" && body.source !== "my_event") {
      return NextResponse.json({ error: "منبع حساب نامعتبر است." }, { status: 400 });
    }
    if (!body.id || !body.roleId) {
      return NextResponse.json(
        { error: "شناسه کاربر و نقش الزامی است." },
        { status: 400 }
      );
    }

    const row = await updateDirectoryRole({
      source: body.source,
      id: body.id,
      roleId: body.roleId,
    });
    return NextResponse.json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا";
    const status = message.includes("یافت نشد") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
