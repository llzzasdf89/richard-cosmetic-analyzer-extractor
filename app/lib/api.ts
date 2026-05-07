// lib/api.ts — 统一入口，类似 Koa 的 app
import { NextRequest } from "next/server";
import { withBase } from "./compose";
import { AppContext, RouteHandler } from "./types";

type Methods = {
    GET?: RouteHandler;
    POST?: RouteHandler;
    PUT?: RouteHandler;
    DELETE?: RouteHandler;
    PATCH?: RouteHandler;
};

/** 公开接口：自动挂载基础中间件 */
export function createHandler(methods: Methods) {
    return buildHandler(withBase, methods);
}

function buildHandler(baseCompose: typeof withBase, methods: Methods) {
    const wrapped: Record<string, (req: NextRequest) => Promise<Response>> = {};

    for (const [method, handler] of Object.entries(methods)) {
        if (handler) {
            const wrappedHandler = baseCompose(handler);
            wrapped[method] = (req: NextRequest) =>
                wrappedHandler(req, {} as AppContext);
        }
    }

    return wrapped;
}