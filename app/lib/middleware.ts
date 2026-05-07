// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export function middleware(req: NextRequest) {
    const requestId = req.headers.get("x-request-id") ?? uuidv4();
    const res = NextResponse.next();

    // 向下游 Route Handler 传递
    res.headers.set("x-request-id", requestId);
    // 响应头也带上，方便客户端排查
    res.headers.set("x-request-id", requestId);

    return res;
}

export const config = {
    matcher: "/api/:path*",
};