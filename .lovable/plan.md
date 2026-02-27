

# Fix: Avatar not updating after upload

## Root Cause

The avatar filename is always `{userId}/avatar.{ext}` (line 26 of `useProfileImage.ts`). Since the URL never changes after re-upload, the browser serves the cached old image. Additionally, `AppHeader` loads the profile once via `useEffect` with no refetch mechanism, so even if the URL did change, the header wouldn't update.

## Changes

### 1. `src/hooks/useProfileImage.ts` -- Unique filename + cache busting

- Change filename from `avatar.{ext}` to `avatar_{timestamp}.{ext}` so each upload produces a new URL
- Before uploading, delete old avatar files in the user's folder (list + remove)
- Return the new URL with a `?v={timestamp}` query param for extra cache safety

### 2. `src/pages/Settings.tsx` -- Trigger header refresh after upload

- After `handleImageUpload` succeeds and sets local profile state, invalidate the `user-profile-header` query so AppHeader refetches

### 3. `src/components/AppHeader.tsx` -- Use React Query instead of one-time useEffect

- Replace the `useEffect` + `useState` pattern with a `useQuery` keyed as `['user-profile-header']`
- This allows invalidation from Settings to trigger an immediate refetch in the header
- Append `?v={updated_at}` to the avatar URL when rendering

### 4. `src/components/settings/ProfileTab.tsx` -- Cache-bust rendered avatar

- Append `?v={Date.now()}` to `profile.avatarUrl` in the Avatar component so it always shows the freshest version after upload

## Technical Details

### useProfileImage.ts changes
```text
// Before upload: remove old files
const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
if (existingFiles?.length) {
  await supabase.storage.from('avatars').remove(existingFiles.map(f => `${user.id}/${f.name}`));
}

// New unique filename
const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

// Return with cache buster
return `${publicUrl}?v=${Date.now()}`;
```

### AppHeader.tsx changes
```text
// Replace useEffect+useState with useQuery
const { data: userProfile } = useQuery({
  queryKey: ['user-profile-header'],
  queryFn: async () => { /* fetch from profiles table */ },
  staleTime: 2 * 60 * 1000,
});

// In render: append ?v= to avatar_url
src={`${userProfile?.avatar_url}?v=${userProfile?.updated_at || ''}`}
```

### Settings.tsx changes
```text
const queryClient = useQueryClient();

const handleImageUpload = async (file: File) => {
  const newAvatarUrl = await uploadProfileImage(file);
  setProfile(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
  queryClient.invalidateQueries({ queryKey: ['user-profile-header'] });
};
```

## Files affected

| File | Change |
|---|---|
| `src/hooks/useProfileImage.ts` | Unique filename + cleanup old files + cache bust |
| `src/pages/Settings.tsx` | Invalidate header query after upload |
| `src/components/AppHeader.tsx` | useQuery instead of useEffect for profile |
| `src/components/settings/ProfileTab.tsx` | Minor: cache-bust avatar src |

