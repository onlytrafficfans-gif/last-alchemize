import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getUserFromToken } from "../lib/auth";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const authHeader = opts.req.headers.get('authorization');
  let user = null;

  if (authHeader) {
    if (!authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] Invalid authorization header format');
    } else {
      const token = authHeader.substring(7);

      if (!token || token.length === 0) {
        console.warn('[Auth] Empty bearer token');
      } else if (token.split('.').length !== 3) {
        console.warn('[Auth] Invalid JWT format');
      } else {
        user = await getUserFromToken(token);
        if (!user) {
          console.warn('[Auth] Failed to verify token');
        }
      }
    }
  }

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
