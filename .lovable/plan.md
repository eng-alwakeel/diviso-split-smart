

# Add Credit Balance as Clickable Menu Item

## What
Make the credits line in the dropdown menu a clickable item that navigates to `/credit-store`, with a `Coins` icon for visual clarity.

## Change

### `src/components/AppHeader.tsx`

Replace the static `<p>` credits text (lines 156-159) with a clickable `DropdownMenuItem` that navigates to `/credit-store`:

- Add `Coins` to the existing lucide-react import
- Replace the `<p className="text-xs...">` block with a `DropdownMenuItem` styled consistently with other menu items
- Show the balance with a Coins icon, and the founding user number if applicable
- Clicking it navigates to `/credit-store`

The item will sit right below the user name/email section, before the separator — giving it prominence as a quick-access balance indicator.

