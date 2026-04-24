import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const rootLogger = pino(
    {
        level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
        base: {
            service: "richard-cosmetic-analyzer-extractor",
            env: process.env.NODE_ENV,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        serializers: {
            err: pino.stdSerializers.err,
        },
    },
    isProduction
        ? pino.transport({
            targets: [
                {
                    target: "pino-roll",
                    options: {
                        file: "/app/logs/app",
                        frequency: "daily",
                        extension: ".log",
                        dateFormat: "yyyy-MM-dd",
                        mkdir: true,
                    },
                },
                {
                    target: "pino/file",
                    options: { destination: 1 }, // stdout
                },
            ],
        })
        : pino.transport({
            target: "pino-pretty",
            options: { colorize: true, ignore: "pid,hostname" },
        })
);