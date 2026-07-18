import { NextResponse } from "next/server";
import { listDirectoryAccounts } from "@/lib/admin/directory";

export async function GET() {
  try {
    const users = await listDirectoryAccounts();
    return NextResponse.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
