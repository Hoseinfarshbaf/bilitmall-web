import { NextResponse } from "next/server";
import { createRole, listRoles } from "@/lib/admin/directory";

export async function GET() {
  try {
    const roles = await listRoles();
    return NextResponse.json(roles);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      slug?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "نام نقش الزامی است." }, { status: 400 });
    }

    const role = await createRole({
      name: body.name,
      description: body.description,
      slug: body.slug,
    });
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ساخت نقش";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
