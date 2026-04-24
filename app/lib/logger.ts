import pino from "pino";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
const logDir = path.join(process.cwd(), "logs");

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
                        file: path.join(logDir, "app"),
                        frequency: "daily",
                        extension: ".log",
                        dateFormat: "yyyy-MM-dd",
                        mkdir: true,
                        size: "500m",   // 当天日志的一部分最大500M，如果超出了那么就被切分到文件2
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