

# Fix Header Direction (RTL Bell/Profile Swap)

## Problem
In RTL (Arabic), CSS `justify-self-start` maps to the **right** side and `justify-self-end` maps to the **left** side. Currently the bell is in the first column (`start` = right in RTL) and profile in the last column (`end` = left in RTL). This puts the bell on the right and profile on the left — the opposite of what you want.

## Fix

### `src/components/AppHeader.tsx`
Swap the first and third columns:
- **First column** (`justify-self-start`): Profile Avatar dropdown (appears right in RTL)
- **Third column** (`justify-self-end`): Notification Bell (appears left in RTL)

This way in Arabic RTL: profile is on the right, bell is on the left — matching the intended layout.

| File | Change |
|---|---|
| `src/components/AppHeader.tsx` | Swap bell and profile column positions |

