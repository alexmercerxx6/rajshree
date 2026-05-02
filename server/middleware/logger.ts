import { logger } from "../utils/logger";

export default defineEventHandler((event) => {
  const start = Date.now();
  const req = event.node.req;
  const res = event.node.res;

  // Log request start
  // logger.info('HTTP', `Incoming ${req.method} ${req.url}`);

  // Hook into response finish to log duration and status
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.url;

    // Log levels based on status
    if (status >= 500) {
      logger.error("HTTP", `${method} ${url} - ${status} (${duration}ms)`);
    } else if (status >= 400) {
      logger.warn("HTTP", `${method} ${url} - ${status} (${duration}ms)`);
    } else {
      logger.info("HTTP", `${method} ${url} - ${status} (${duration}ms)`);
    }
  });
});
