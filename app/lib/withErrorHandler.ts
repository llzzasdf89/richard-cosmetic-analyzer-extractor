// lib/middleware/withErrorHandler.ts
import { NextResponse } from "next/server";
import { Middleware } from "./types";

export const withErrorHandler: Middleware = (next) => async (req, ctx) => {
    try {
        return await next(req, ctx);
    } catch (err) {
        ctx.logger.error({ err }, "Unhandled exception");

        return NextResponse.json(
            {
                error: "Internal Server Error",
                requestId: ctx.requestId, // 返回给前端，方便排查
            },
            { status: 500 }
        );
    }
};