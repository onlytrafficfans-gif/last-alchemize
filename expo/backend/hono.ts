import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { isReady, getInitError } from "./lib/surrealdb";

const app = new Hono();

// Native app requests (iOS/Android) don't send an Origin header, so CORS only
// matters for the web build. Restrict to the production web domain (app.json's
// router.origin) and localhost for local dev.
const ALLOWED_ORIGINS = ["https://alchemize.app"];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (ALLOWED_ORIGINS.includes(origin)) return origin;
      if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
      return null;
    },
  }),
);

// Readiness middleware: block all data-access routes until DB is ready
app.use("/api/trpc/*", async (c, next) => {
  if (!isReady()) {
    return c.json(
      {
        status: "unavailable",
        message: "Service initializing. Database not ready.",
      },
      503,
    );
  }
  await next();
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

// Liveness endpoint: responds if the process is alive (even during initialization)
app.get("/health", (c) => {
  return c.json({ status: "alive" }, 200);
});

// Readiness endpoint: responds only when fully initialized and ready for traffic
app.get("/ready", (c) => {
  if (!isReady()) {
    const error = getInitError();
    return c.json(
      {
        status: "not_ready",
        message: "Service is initializing",
        error: error?.message || "Unknown error",
      },
      503,
    );
  }
  return c.json({ status: "ready" }, 200);
});

// Legacy root endpoint for backwards compatibility
app.get("/", (c) => {
  if (!isReady()) {
    const error = getInitError();
    return c.json(
      {
        status: "error",
        message: "SurrealDB not initialized",
        error: error?.message || "Unknown error",
      },
      503,
    );
  }
  return c.json({ status: "ok", message: "API is running" });
});

// Error handler: ensure database errors are never exposed
app.onError((error, c) => {
  console.error("[API Error]", error.message);
  if (error.message.includes("SurrealDB") || error.message.includes("database")) {
    return c.json(
      {
        status: "error",
        message: "An internal error occurred",
      },
      500,
    );
  }
  return c.json(
    {
      status: "error",
      message: error.message || "An error occurred",
    },
    500,
  );
});

export default app;
