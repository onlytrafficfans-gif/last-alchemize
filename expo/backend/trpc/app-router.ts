import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { manifestationsRouter } from "./routes/manifestations";
import { goalsRouter } from "./routes/goals";
import { tasksRouter } from "./routes/tasks";
import { gratitudeRouter } from "./routes/gratitude";
import { statusRouter } from "./routes/status";
import { accountRouter } from "./routes/account";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  manifestations: manifestationsRouter,
  goals: goalsRouter,
  tasks: tasksRouter,
  gratitude: gratitudeRouter,
  status: statusRouter,
  account: accountRouter,
});

export type AppRouter = typeof appRouter;
