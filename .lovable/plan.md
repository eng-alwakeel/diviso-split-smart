

# Cleaner AppHeader: Logo Center, Bell Left, Profile Right

## Current State
The header has 3 columns:
- **Left**: Role badges + Profile avatar dropdown
- **Center**: Logo
- **Right**: Credit balance + Notification bell

This is cluttered, especially on mobile with role badges taking space.

## Target Layout
Based on the screenshot reference, simplify to:
- **Right (RTL start)**: Profile avatar dropdown only
- **Center**: Logo
- **Left (RTL end)**: Notification bell only

## Changes

### `src/components/AppHeader.tsx`
1. **Left column** (justify-self-start): Move `NotificationBell` here — just the bell icon, clean
2. **Center column**: Keep logo as-is
3. **Right column** (justify-self-end): Move profile `Avatar` dropdown here — remove `RoleBadgesList` from the header bar (keep role items inside the dropdown menu)
4. **Remove** `CreditBalance` from the top bar (it's already shown inside the dropdown menu as credits text)
5. Keep the dropdown menu content unchanged — all menu items, roles, logout stay inside

## Result
A clean 3-column header: 🔔 | Logo | 👤 — matching the cleaner look the user wants.

## Files
| File | Action |
|---|---|
| `src/components/AppHeader.tsx` | Edit — rearrange columns |

