import { NextResponse } from "next/server";
import { listBilitmallUsersForAdmin } from "@/lib/bilitmall/store";

export async function GET() {
  const users = await listBilitmallUsersForAdmin();
  return NextResponse.json(users);
}
