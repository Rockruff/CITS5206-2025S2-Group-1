import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = path.join("/");
  const url = `http://127.0.0.1:8000/api/${pathname}`;

  // Forward the request to backend
  const backendResp = await fetch(url, {
    method: req.method,
    headers: req.headers,
  });

  const body = await backendResp.text();
  return new NextResponse(body, {
    status: backendResp.status,
    headers: backendResp.headers,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = path.join("/");
  const url = `http://127.0.0.1:8000/api/${pathname}`;

  // Forward the request to backend
  const backendResp = await fetch(url, {
    method: req.method,
    headers: req.headers,
    body: await req.text(),
  });

  const body = await backendResp.text();
  return new NextResponse(body, {
    status: backendResp.status,
    headers: backendResp.headers,
  });
}

export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;
