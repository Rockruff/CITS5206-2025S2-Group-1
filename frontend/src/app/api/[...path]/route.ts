import { NextRequest, NextResponse } from "next/server";

async function forward(req: NextRequest) {
  // Redirect to Django backend
  const url = new URL(req.url);
  url.host = "127.0.0.1:8000";

  const backendResp = await fetch(url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    // @ts-expect-error Node fetch requires this
    duplex: "half",
    redirect: "manual",
  });

  return new NextResponse(backendResp.body, {
    status: backendResp.status,
    headers: backendResp.headers,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
