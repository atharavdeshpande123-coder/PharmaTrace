import { NextResponse } from "next/server";

// Health-check endpoint for the API root.
export async function GET() {
  return NextResponse.json({ status: "ok", service: "pharmatrace", mode: "demo" });
}
