/**
 * @starter/logger — Beautiful, injectable logger for TS/JS. Use createLogger() and inject anywhere.
 */

export { type FormatOptions, format, formatTimestamp } from "./format";
export type { LogLevel, LogLevelName } from "./levels";
export { LEVEL_COLORS, LEVEL_LABELS, LOG_LEVELS, shouldLog } from "./levels";
export { createLogger, type Logger, type LoggerOptions } from "./logger";
export { consoleTransport, createTransport, type Transport } from "./transport";
