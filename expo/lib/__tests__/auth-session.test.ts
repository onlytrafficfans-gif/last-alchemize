import { describe, expect, test } from 'bun:test';
import { parseStoredSession } from '../auth-session';

const session = { user: { id: 'local-user', email: 'test@example.com', name: 'Test' }, token: 'local-token' };

describe('session restoration', () => {
  test('restores existing local sessions without inventing an expiry', () => {
    expect(parseStoredSession(JSON.stringify(session))).toEqual(session);
  });
  test('damaged JSON and incomplete sessions return to sign-in', () => {
    for (const raw of ['broken', 'null', '{}', JSON.stringify({ ...session, token: null }),
      JSON.stringify({ ...session, user: { id: undefined } })]) {
      expect(parseStoredSession(raw)).toBeNull();
    }
  });
  test('explicit expired or malformed expiry cannot restore a session', () => {
    for (const expiresAt of [999, 1000, 'tomorrow', null]) {
      expect(parseStoredSession(JSON.stringify({ ...session, expiresAt }), 1000)).toBeNull();
    }
    expect(parseStoredSession(JSON.stringify({ ...session, expiresAt: 1001 }), 1000)).toEqual(session);
  });
});
