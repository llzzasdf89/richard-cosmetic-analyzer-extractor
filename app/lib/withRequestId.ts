// lib/middleware/withRequestId.ts
import { Middleware } from "./types";
import { rootLogger } from "./logger";

export const withRequestId: Middleware = (next) => async (req, ctx) => {
    const requestId =
        req.headers.get("x-request-id") ?? crypto.randomUUID();

    // 创建绑定了 requestId 的子 logger —— 所有日志自动带上这个字段
    const logger = rootLogger.child({ requestId });

    return next(req, {
        ...ctx,
        requestId,
        logger,
        startTime: Date.now(),
    });
};