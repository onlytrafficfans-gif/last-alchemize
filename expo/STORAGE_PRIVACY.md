# Private Storage and Image Safety

Last Updated: 2025-08-07

## Image Storage Architecture

### User Path Isolation

All user images are stored under a path-based namespace:

```
users/{userId}/uploads/{timestamp}-{filename}.jpg
```

- **userId** — derived from authenticated session, never from client input
- **timestamp** — Date.now() at upload time, prevents collisions
- **filename** — sanitized original filename (max 50 chars, alphanumeric + dash/underscore only)
- **Extension** — Always `.jpg` (image/jpeg MIME type), never user-supplied

This ensures:
- ✅ Each user's images are isolated by path
- ✅ No direct object name enumeration possible
- ✅ Filenames cannot leak sensitive information
- ✅ Bucket policies can enforce user-level RLS

### Bucket Configuration

The `user-uploads` Supabase Storage bucket must be configured as:

- **Privacy:** Private (not public)
- **RLS Policy:** Enabled (enforces path-based access)
- **Direct Access:** Denied (all access via signed URLs)

### Signed URL Generation

Signed URLs are generated on-demand when images need to be displayed:

- **Expiry:** 1 hour (3600 seconds)
- **Generation:** Triggered by client UI rendering
- **Refresh:** New URL generated if displayed URL expires
- **Caching:** URLs cached locally, not persisted to database

This ensures:
- ✅ URLs cannot be replayed after expiration
- ✅ Database does not contain URLs (only storage paths)
- ✅ URL compromise is time-limited
- ✅ Leaked URLs are useless within 1 hour

## Image Processing Safety

### Compression Pipeline

1. **File size validation:** Reject files over 20 MB before processing
2. **Format conversion:** Always convert to JPEG (lossy, removes metadata)
3. **Dimension limiting:** Resize to max 1600px (prevents storage abuse)
4. **Quality:** 0.75 compression quality (balances size/fidelity)
5. **MIME validation:** Verify output is image/jpeg before upload

This ensures:
- ✅ No metadata preservation (EXIF, ICC profiles, etc.)
- ✅ No upscaling of small images
- ✅ Consistent MIME type (image/jpeg, never image/png)
- ✅ Bounded storage usage

### Temporary File Cleanup

Compressed files are deleted immediately after upload:

```typescript
finally {
  if (tempFileUri) {
    await FileSystem.deleteAsync(tempFileUri, { idempotent: true });
  }
}
```

This ensures:
- ✅ No temporary files persist in device storage
- ✅ No recovery of compressed images post-upload
- ✅ Cleanup is idempotent (safe to retry)

## Data Handling Rules

### What IS Stored

- Storage path: `users/{userId}/uploads/{timestamp}-{filename}.jpg`
- Image dimensions and compression ratio (metadata only)
- Timestamp of upload
- User ID (derived from auth, never client input)

### What IS NOT Stored

- ❌ Original filename (only sanitized version in path)
- ❌ Signed URLs (generated on-demand)
- ❌ Permanent public URLs
- ❌ Image EXIF data
- ❌ Image metadata
- ❌ Temporary file paths

### What IS NOT Logged

- ❌ User IDs
- ❌ Storage paths
- ❌ Signed URLs
- ❌ Original filenames
- ❌ Image content

Production logs only contain:
- Upload/delete status (success/error)
- Error messages (generic, no paths)
- Compression ratio and file sizes

## Account Deletion

When a user's account is deleted:

1. Database records reference image storage paths
2. All storage paths are enumerated from database
3. Each image is deleted via `deleteImage(storagePath)`
4. Deletion is retried if it fails
5. User is not deleted from auth until storage is cleaned

This ensures:
- ✅ Orphaned images cannot occur
- ✅ Deletion is atomic (linked to account)
- ✅ Partial failures are retried
- ✅ No signed URLs remain valid after deletion

## Verification Checklist

### Code-Level Verification (COMPLETED)

- ✅ All images stored under `users/{userId}` path
- ✅ MIME type validated as image/jpeg
- ✅ Signed URLs generated on-demand, not persisted
- ✅ 1-hour signed URL expiry enforced
- ✅ Temporary files deleted after upload
- ✅ Delete function available for cleanup
- ✅ No original filenames in storage path
- ✅ No upscaling of small images
- ✅ No personal data in logs

### External Verification Required

These checks must be performed on live Supabase project:

1. **Bucket Privacy**
   - [ ] `user-uploads` bucket is marked "Private" in Supabase dashboard
   - [ ] Direct public access returns 403
   - [ ] RLS policies are enabled

2. **Access Control**
   - [ ] Anonymous user cannot list or access objects
   - [ ] User A cannot retrieve User B's objects via signed URL
   - [ ] Expired signed URLs return 403
   - [ ] Tampered signed URLs return 403

3. **Signed URL Validity**
   - [ ] New signed URLs generate on each request
   - [ ] Old signed URLs become invalid after 1 hour
   - [ ] URLs cannot be reused across sessions

4. **No Direct Access**
   - [ ] Images have no public CDN URL
   - [ ] Direct bucket path returns 403
   - [ ] Only authenticated signed URLs work

## Usage in Application

### Uploading an Image

```typescript
const result = await compressAndUpload(pickerResult.uri, pickerResult.fileName);

if (result.success && result.path) {
  // Store result.path in database (not the signed URL)
  await db.create('manifestations', {
    userId: currentUser.id,
    imagePath: result.path,
    // ... other fields
  });
}
```

### Displaying an Image

```typescript
const imagePath = manifestation.imagePath; // stored path
const signedUrl = await getImageSignedUrl(imagePath); // on-demand

<Image source={{ uri: signedUrl }} />
```

### Deleting an Image

```typescript
const imagePath = manifestation.imagePath;
await deleteImage(imagePath); // before deleting database record
```

## Security Model Summary

| Layer | Protection |
|-------|-----------|
| **Storage** | Private bucket, path-based isolation |
| **Access** | Signed URLs only, 1-hour expiry |
| **Processing** | JPEG conversion, metadata removal |
| **Naming** | UUID-like timestamp + sanitized filename |
| **Deletion** | Linked to account deletion, retried |
| **Logging** | Paths and URLs excluded from logs |

This multi-layer defense ensures that even if one layer is compromised, others provide protection.
