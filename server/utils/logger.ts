export const logger = {
  info(category: string, message: string, meta?: any) {
    console.log(formatLog("INFO", category, message, meta));
  },

  warn(category: string, message: string, meta?: any) {
    console.warn(formatLog("WARN", category, message, meta));
  },

  error(category: string, message: string, meta?: any) {
    console.error(formatLog("ERROR", category, message, meta));
  },
};

function formatLog(
  level: string,
  category: string,
  message: string,
  meta?: any,
): string {
  // 1. Convert to IST
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  // Format: YYYY-MM-DD HH:MM:SS
  const timestamp = istTime.toISOString().replace("T", " ").substring(0, 19);

  // 2. Formatting: Align components for readability
  let log = `[${timestamp}] [${level.padEnd(5)}] [${category}] ${message}`;

  if (meta) {
    if (meta instanceof Error) {
      log += `\nStack: ${meta.stack}`;
    } else {
      try {
        // Pretty print objects with indentation
        log += `\n${JSON.stringify(meta, null, 2)}`;
      } catch (e) {
        log += ` [Circular/Unserializable]`;
      }
    }
  }

  return log;
}
