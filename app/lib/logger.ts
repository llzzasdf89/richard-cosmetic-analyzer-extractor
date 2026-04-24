import pino from "pino";

export const rootLogger = pino({
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),

    // 生产：输出 JSON，对接 Datadog / Loki / CloudWatch
    // 开发：pino-pretty 美化输出
    ...(process.env.NODE_ENV !== "production" && {
        transport: {
            target: "pino-pretty",
            options: { colorize: true, ignore: "pid,hostname" },
        },
    }),

    // 统一的基础字段
    base: {
        service: "richard-cosmetic-analyzer-extractor",
        env: process.env.NODE_ENV,
    },

    // 时间戳使用 ISO 格式
    timestamp: pino.stdTimeFunctions.isoTime,

    // 序列化 Error 对象
    serializers: {
        err: pino.stdSerializers.err,
    },
});