// lib/middleware/types.ts
import type { NextRequest } from "next/server";
import type { Logger } from "pino";

export interface AppContext {
    requestId: string;
    logger: Logger;         // 已绑定 requestId 的子 logger
    userId?: string;
    startTime: number;
}

export type RouteHandler = (
    req: NextRequest,
    ctx: AppContext
) => Promise<Response>;

export type Middleware = (next: RouteHandler) => RouteHandler;