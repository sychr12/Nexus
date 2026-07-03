type LogContext = Record<string, unknown>;

function shouldLog() {
  return process.env.NODE_ENV !== "production";
}

export const logger = {
  error(message: string, error?: unknown, context?: LogContext) {
    if (!shouldLog()) return;
    console.error(message, error, context);
  },
  warn(message: string, context?: LogContext) {
    if (!shouldLog()) return;
    console.warn(message, context);
  },
};
