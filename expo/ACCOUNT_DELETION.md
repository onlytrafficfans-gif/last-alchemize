# Account Deletion Completeness

Last Updated: 2025-08-07

## Deletion Inventory

When a user deletes their account, the following data must be removed from all storage layers:

### 1. SurrealDB Records

All user-owned records are identified by `userId` field and deleted server-side:

| Table | Records Affected | Deletion Order |
|-------|------------------|-----------------|
| users | User account | Last (after all dependent records) |
| manifestations | User manifestations | 1 |
| goals | User goals | 2 |
| goal_completions | Completions for user's goals | 2a (before goals) |
| tasks | User tasks | 3 |
| gratitude_entries | User gratitude entries | 4 |
| appointments | User appointments | 5 |

Deletion order ensures referential integrity:
1. Delete dependent records first (completions, entries)
2. Delete parent records (goals, tasks, etc.)
3. Delete user account last

**Scope:** All records where `userId = $currentUserId` (derived from auth token)

### 2. Supabase Storage

All user images are deleted from `user-uploads` bucket:

| Path Pattern | Deletion Method |
|--------------|-----------------|
| `users/{userId}/uploads/*` | Enumerated from database, deleted individually |

Process:
1. Query all records with `imagePath` or `images` fields
2. Collect all storage paths
3. Delete each path via `storage.remove()`
4. Retry failed deletions

**Scope:** All objects under `users/{userId}/uploads/` prefix

### 3. Supabase Auth

| Component | Deletion Method |
|-----------|-----------------|
| User account | Supabase Auth API (future) |

**Current Status:** NOT IMPLEMENTED - requires service role key
**Scope:** The authenticated user's auth account

### 4. Local SQLite Database

Handled by client-side `resetDatabase()`:

| Platform | Behavior |
|----------|----------|
| Native (iOS/Android) | DELETE WHERE userId = $currentUserId |
| Web | Filter webStore entries by userId |

**Scope:** Current user only (uses `getCurrentUserId()`)

**Tables affected:**
- All USER_SCOPED_TABLES (manifestations, goals, tasks, etc.)
- goal_completions (cascade delete)

### 5. Secure Storage (SecureStore)

| Item | Key |
|------|-----|
| Auth token | AUTH_SECURE_KEY |
| Refresh token | (if present) |

**Deletion:** `secureStorage.removeItem()` via `logout()`

### 6. AsyncStorage (Local Storage)

| Item | Key |
|------|-----|
| Auth state | AUTH_STORAGE_KEY |
| Remember-me flag | REMEMBER_ME_KEY |
| Cached data | Various feature keys |

**Deletion:** `AsyncStorage.removeItem()` via `logout()`

### 7. Notifications (expo-notifications)

| Type | Deletion Method |
|------|-----------------|
| Scheduled notifications | `cancelAllScheduledNotificationsAsync()` (future) |
| Push notification tokens | Cleared on logout |

**Current Status:** NOT FULLY IMPLEMENTED
**Scope:** All notifications for this user

### 8. RevenueCat (Subscriptions)

| Component | Deletion Method |
|-----------|-----------------|
| Customer identity | Clear customer ID, logout (future) |
| Cached entitlements | Cleared on logout |

**Current Status:** NOT IMPLEMENTED
**Scope:** Linked to app user ID (separate from auth)

### 9. HealthKit (iOS Only)

| Component | Deletion Method |
|-----------|-----------------|
| Imported workout data | Preserved (HealthKit-sourced) |
| Imported metrics | Preserved (HealthKit-sourced) |
| Sync timestamps | Cleared on logout |

**Behavior:** HealthKit-imported data is not deleted (user retains iOS health data)

## Deletion Workflow

### Client-Side Flow

```
User taps "Delete Account"
    ↓
Confirmation dialog (2 confirmations for safety)
    ↓
Call account.delete() via tRPC
    ↓
Server processes deletion (see below)
    ↓
On success:
  ↓ resetDatabase() - clear local SQLite
  ↓ logout() - clear SecureStore, AsyncStorage
  ↓ cancelNotifications() - clear scheduled notifications
  ↓ Navigate to login
    ↓
On error: Show error, allow retry
```

### Server-Side Flow (account.delete mutation)

```
Verify user authentication
    ↓
Enumerate image paths from SurrealDB
    ↓
For each image path:
  ↓ Delete from Supabase storage
  ↓ Log deletion (retry failed)
    ↓
Delete SurrealDB records (by dependency order):
  ↓ goal_completions
  ↓ manifestations, goals, tasks, gratitude_entries, appointments
  ↓ users (account record)
    ↓
Return success/error with inventory
```

## Safety Guarantees

### Atomic Deletion (Within Scope)

1. **SurrealDB:** Single transaction per table type
2. **Storage:** Individual deletions, failures logged and retried
3. **Local:** Per-table deletion in order

### Idempotent Retry

- Storage deletion failures are retried
- Client can safely re-call account.delete() if server error occurs
- Already-deleted records are skipped (no error on second delete)

### Cross-User Isolation

- Deletion only affects `ctx.user.id` (from auth token)
- Other users' data is never touched
- Path-based storage isolation ensures no accidental deletion

### Error Handling

1. **Storage deletion fails:** Logged, retried, but doesn't block user deletion
2. **SurrealDB deletion fails:** Stops deletion, returns error to client
3. **Client deletion fails:** User can retry or logout and delete on next login

## Verification Checklist

### Code-Level Verification (COMPLETED)

- ✅ SurrealDB deletion scoped to `userId = $currentUserId`
- ✅ Deletion order respects referential integrity
- ✅ Image paths enumerated before deletion
- ✅ Storage deletion retried on failure
- ✅ Client-side resetDatabase() filters by currentUserId
- ✅ LocalStorage/SecureStore cleared on logout
- ✅ No cross-user deletion possible

### External Verification Required

- [ ] Supabase Auth user deletion implemented
- [ ] RevenueCat customer identity cleared
- [ ] Notification schedules cancelled
- [ ] Second user can verify first user's data absent
- [ ] Partial deletion + retry works correctly
- [ ] HealthKit data preserved after account deletion

## Known Limitations

### Data NOT Deleted

1. **HealthKit data:** Intentionally preserved (user retains iOS health data)
2. **Supabase Auth records:** Requires service role key (future)
3. **RevenueCat customer:** Requires RevenueCat API (future)
4. **Scheduled notifications:** Requires cleanup before deletion (future)

### Future Improvements

1. Implement Supabase Auth user deletion
2. Implement RevenueCat customer deletion
3. Implement notification cancellation before logout
4. Add deletion confirmation via email
5. Add data export before deletion option
6. Add soft-delete for future data recovery

## Testing

### Manual Test (Multi-User)

1. Create User A, add manifestations with images
2. Create User B, add goals with images
3. Delete User A
4. Verify User A data gone from all layers
5. Verify User B data unchanged

### Regression Tests

See `backend/__tests__/account-deletion.test.ts`:
- ✅ User A deletion doesn't affect User B
- ✅ All image paths deleted from storage
- ✅ All SurrealDB records deleted
- ✅ All local SQLite records deleted
- ✅ Re-deletion is idempotent

## Related Configurations

- **Supabase bucket:** `user-uploads` (private)
- **SurrealDB:** `RORK_DB_ENDPOINT`, `RORK_DB_NAMESPACE`, `RORK_DB_TOKEN`
- **Local DB:** `expo-sqlite` (native), web in-memory
- **Secure storage:** `expo-secure-store` (native), AsyncStorage (web)

## Summary

Account deletion is **MULTI-LAYER** and **SCOPED-BY-USERID**:

| Layer | Status | Scope |
|-------|--------|-------|
| SurrealDB | ✅ Complete | userId |
| Supabase Storage | ✅ Complete | users/{userId}/* |
| Supabase Auth | ❌ Pending | (future) |
| SQLite | ✅ Complete | userId |
| SecureStore | ✅ Complete | logout() |
| AsyncStorage | ✅ Complete | logout() |
| Notifications | ❌ Pending | (future) |
| RevenueCat | ❌ Pending | (future) |
| HealthKit | ✅ Preserved | (intentional) |

The critical path (SurrealDB + Storage + SQLite) is complete and verified.
