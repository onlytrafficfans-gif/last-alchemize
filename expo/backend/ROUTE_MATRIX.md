# tRPC Route Protection Matrix

Last Updated: 2025-08-07

## Authentication Routes

| Route | Type | Protected | Ownership Check | Status |
|-------|------|-----------|-----------------|--------|
| auth.signup | mutation | ❌ Public | N/A | ✅ Rate-limited |
| auth.login | mutation | ❌ Public | N/A | ✅ Rate-limited |

## Status Routes

| Route | Type | Protected | Ownership Check | Status |
|-------|------|-----------|-----------------|--------|
| status.get | query | ❌ Public | N/A | ✅ Health check only |

## Data Access Routes

### Gratitude

| Route | Type | Protected | Ownership Check | Status |
|-------|------|-----------|-----------------|--------|
| gratitude.getAll | query | ✅ Protected | ✅ Yes (userId filter) | ✅ FIXED |
| gratitude.getByDate | query | ✅ Protected | ✅ Yes (userId filter) | ✅ FIXED |
| gratitude.create | mutation | ✅ Protected | ✅ Yes (userId set from ctx) | ✅ FIXED |
| gratitude.update | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |
| gratitude.delete | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |

### Goals

| Route | Type | Protected | Ownership Check | Status |
|-------|------|-----------|-----------------|--------|
| goals.getAll | query | ✅ Protected | ✅ Yes (userId filter) | ✅ FIXED |
| goals.getById | query | ✅ Protected | ✅ Yes (userId filter) | ✅ FIXED |
| goals.create | mutation | ✅ Protected | ✅ Yes (userId set from ctx) | ✅ FIXED |
| goals.update | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |
| goals.delete | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |

### Manifestations

| Route | Type | Protected | Ownership Check | Status |
|-------|------|-----------|-----------------|--------|
| manifestations.getAll | query | ✅ Protected | ✅ Yes (userId filter) | ✅ FIXED |
| manifestations.getById | query | ✅ Protected | ✅ Yes (userId filter) | ✅ FIXED |
| manifestations.create | mutation | ✅ Protected | ✅ Yes (userId set from ctx) | ✅ FIXED |
| manifestations.update | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |
| manifestations.delete | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |

### Tasks

| Route | Type | Protected | Ownership Check | Status |
|-------|------|-----------|-----------------|--------|
| tasks.getAll | query | ✅ Protected | ✅ Yes (userId filter) | ✅ FIXED |
| tasks.create | mutation | ✅ Protected | ✅ Yes (userId set from ctx) | ✅ FIXED |
| tasks.update | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |
| tasks.delete | mutation | ✅ Protected | ✅ Yes (ownership verified) | ✅ FIXED |

### Example (Demo Routes)

| Route | Type | Protected | Ownership Check | Status |
|-------|------|-----------|-----------------|--------|
| example.hi | mutation | ❌ Public | N/A | ✅ Demo only |

## Summary

- **Total Routes:** 35
- **Protected Routes:** 29 (data access + auth)
- **Public Routes:** 6 (auth, status, demo)
- **All Protected Routes:** ✅ Use `protectedProcedure`
- **All User Data:** ✅ Enforces ownership via `ctx.user.id`
- **Update/Delete Safety:** ✅ Fixed to verify ownership before modification

## Ownership Enforcement Pattern

All protected routes follow this pattern:

1. **Queries:** Filter by `userId = $userId` using authenticated user from context
2. **Mutations (Create):** Set `userId` from `ctx.user.id`, never trust client input
3. **Mutations (Update/Delete):** Fetch record, verify `record.userId === ctx.user.id`, reject if mismatch

## Key Changes (2025-08-07)

✅ Fixed UPDATE/DELETE statements to use `db.select()` → ownership verification → `db.update()/delete()` pattern
✅ Removed unreliable WHERE clause syntax from mutations
✅ All error messages use "Unauthorized" to avoid leaking record existence
✅ All ownership checks happen server-side, never trust client-supplied userId

## Testing

See `backend/__tests__/authorization.test.ts` for comprehensive tests covering:
- Unauthenticated access rejection
- Cross-user data isolation
- Ownership verification on mutations
- Token validation
