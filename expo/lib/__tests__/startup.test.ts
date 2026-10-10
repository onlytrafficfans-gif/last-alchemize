import { describe, expect, test, mock } from 'bun:test';
import { createSplashHider, runBootTask, withTimeout, TimeoutError } from '../startup';

const never = () => new Promise<never>(() => {});
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

describe('withTimeout', () => {
  test('resolves with the value and clears its timer', async () => {
    const spy = mock(clearTimeout);
    const original = globalThis.clearTimeout;
    globalThis.clearTimeout = spy as unknown as typeof clearTimeout;
    try {
      await expect(withTimeout(Promise.resolve(42), 1000, 'ok')).resolves.toBe(42);
      expect(spy).toHaveBeenCalled();
    } finally {
      globalThis.clearTimeout = original;
    }
  });

  test('propagates rejection', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000, 'x')).rejects.toThrow('boom');
  });

  test('rejects with TimeoutError when the promise never settles', async () => {
    await expect(withTimeout(never(), 20, 'hang')).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe('runBootTask (auth loading state)', () => {
  test('normal startup settles loading with ok', async () => {
    const onSettled = mock(() => {});
    const { done } = runBootTask(async () => {}, 1000, 'auth', onSettled);
    await done;
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith('ok');
  });

  test('rejected initialization still settles loading', async () => {
    const onSettled = mock(() => {});
    const { done } = runBootTask(async () => { throw new Error('keychain'); }, 1000, 'auth', onSettled);
    await done;
    expect(onSettled).toHaveBeenCalledWith('error');
  });

  test('synchronously throwing initialization still settles loading', async () => {
    const onSettled = mock(() => {});
    const { done } = runBootTask(() => { throw new Error('sync'); }, 1000, 'auth', onSettled);
    await done;
    expect(onSettled).toHaveBeenCalledWith('error');
  });

  test('never-resolving initialization times out and settles loading', async () => {
    const onSettled = mock(() => {});
    let isActive: () => boolean = () => true;
    const { done } = runBootTask((active) => { isActive = active; return never(); }, 20, 'auth', onSettled);
    await done;
    expect(onSettled).toHaveBeenCalledWith('timeout');
    // A late result after timeout must not apply (proceed unauthenticated).
    expect(isActive()).toBe(false);
  });

  test('cancel (unmount) prevents state updates', async () => {
    const onSettled = mock(() => {});
    const { cancel, done } = runBootTask(async () => { await tick(5); }, 1000, 'auth', onSettled);
    cancel();
    await done;
    expect(onSettled).not.toHaveBeenCalled();
  });
});

describe('createSplashHider', () => {
  test('deduplicates simultaneous calls but retries after a later layout', async () => {
    const hide = mock(() => Promise.resolve());
    const hider = createSplashHider(hide);
    await Promise.all([hider('a'), hider('b')]);
    await hider('c');
    expect(hide).toHaveBeenCalledTimes(2);
  });

  test('rejected hideAsync does not throw', async () => {
    const hider = createSplashHider(() => Promise.reject(new Error('no splash')));
    await expect(hider('x')).resolves.toBeUndefined();
  });

  test('synchronously throwing hideAsync does not throw', async () => {
    const hider = createSplashHider(() => { throw new Error('sync'); });
    await expect(hider('x')).resolves.toBeUndefined();
  });

  test('hide is invoked synchronously, independent of other boot work', () => {
    const hide = mock(() => never());
    void createSplashHider(hide)('root-mount');
    expect(hide).toHaveBeenCalledTimes(1);
  });

  test('a failed native hide can be retried after layout', async () => {
    let attempts = 0;
    const hide = mock(async () => {
      if (++attempts === 1) throw new Error('view not ready');
    });
    const hider = createSplashHider(hide);
    await hider('mount');
    await hider('layout');
    await hider('layout-again');
    expect(hide).toHaveBeenCalledTimes(3);
  });

  test('a stalled native hide times out and permits recovery', async () => {
    let attempts = 0;
    const hide = mock(() => ++attempts === 1 ? never() : Promise.resolve());
    const hider = createSplashHider(hide, 10);
    await hider('mount');
    await hider('layout');
    expect(hide).toHaveBeenCalledTimes(2);
  });
});
