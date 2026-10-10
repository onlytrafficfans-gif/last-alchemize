// Minimal typing for Bun's built-in test runner so `tsc --noEmit` passes
// without adding a bun-types dependency.
declare module 'bun:test' {
  export const describe: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => unknown) => void;
  export const expect: any;
  export const mock: <T extends (...args: any[]) => any>(fn: T) => T & { mock: { calls: unknown[][] } };
}
