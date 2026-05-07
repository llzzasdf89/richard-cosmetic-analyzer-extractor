// lib/middleware/compose.ts
import { Middleware, RouteHandler } from "./types";

export function compose(...middlewares: Middleware[]) {
    return (handler: RouteHandler): RouteHandler => {
        // reduceRight 保证执行顺序从左到右（洋葱模型外层先进）
        return middlewares.reduceRight((acc, mw) => mw(acc), handler);
    };
}

// 预设中间件组合，类似 Koa 的 app.use() 全局注册
import { withRequestId } from "./withRequestId";
import { withLogger } from "./withLogger";
import { withErrorHandler } from "./withErrorHandler";

/** 所有 API 都应使用的基础中间件 */
export const withBase = compose(
    withRequestId,
    withErrorHandler,
    withLogger
);