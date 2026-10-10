// Boot-safety helpers. Kept free of React Native imports so they can be unit
// tested directly with `bun test`.

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Races `promise` against a timer. The timer is always cleared once either
 * side settles, so a successful operation never leaves a pending timeout.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export type BootOutcome = 'ok' | 'error' | 'timeout';

/**
 * Runs a boot-critical task with a hard bound. `onSettled` is called exactly
 * once (success, rejection, or timeout) unless `cancel()` was called first
 * (e.g. on unmount). `isActive()` lets the task skip state writes after it
 * has timed out or been cancelled. Never rejects.
 */
export function runBootTask(
  task: (isActive: () => boolean) => Promise<unknown>,
  ms: number,
  label: string,
  onSettled: (outcome: BootOutcome) => void,
): { cancel: () => void; done: Promise<void> } {
  let active = true;
  const isActive = () => active;
  let start: Promise<unknown>;
  try {
    start = Promise.resolve(task(isActive));
  } catch (error) {
    start = Promise.reject(error);
  }
  const done = withTimeout(start, ms, label)
    .then(
      (): BootOutcome => 'ok',
      (error): BootOutcome => {
        const timedOut = error instanceof TimeoutError;
        console.warn(`[Startup] ${label} ${timedOut ? 'timed out' : 'failed'}:`, error);
        return timedOut ? 'timeout' : 'error';
      },
    )
    .then((outcome) => {
      if (!active) return;
      active = false;
      onSettled(outcome);
    });
  return { cancel: () => { active = false; }, done };
}

/**
 * Deduplicates in-flight hide requests. Native hide can resolve without removing
 * a view that is not ready yet, so later layout/recovery calls must try again.
 */
export function createSplashHider(hideAsync: () => Promise<unknown>, timeoutMs = 1500) {
  let pending: Promise<void> | null = null;
  return (reason: string): Promise<void> => {
    if (!pending) {
      let call: Promise<unknown>;
      try {
        call = Promise.resolve(hideAsync());
      } catch (error) {
        call = Promise.reject(error);
      }
      pending = withTimeout(call, timeoutMs, 'hideNativeSplash').then(
        () => console.info('[Startup] NATIVE_SPLASH_HIDE_COMPLETED', reason),
        (error) => {
          pending = null;
          console.warn('[Startup] Native splash hide failed:', error);
        },
      ).finally(() => { pending = null; });
    }
    return pending;
  };
}
