// lib/middleware/withLogger.ts
import { Middleware } from "./types";

export const withLogger: Middleware = (next) => async (req, ctx) => {
    const { logger, startTime } = ctx;

    logger.info(
        {
            method: req.method,
            url: req.url,
            userAgent: req.headers.get("user-agent"),
        },
        "→ request received"
    );

    try {
        const res = await next(req, ctx);

        logger.info(
            {
                status: res.status,
                durationMs: Date.now() - startTime,
            },
            "← request completed"
        );

        return res;
    } catch (err) {
        logger.error(
            {
                err,
                durationMs: Date.now() - startTime,
            },
            "✗ request failed"
        );
        throw err; // 继续向上抛，交给错误处理层
    }
};