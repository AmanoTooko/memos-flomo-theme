# Change Log

## Current UI refresh

- Rebalanced the page against the flomo reference: wider sidebar, tighter content max width, softer editor/card borders, and a restored green active quick-link block.
- Retuned the calendar after review: reduced the excessive column spacing, restored a more square flomo-like cell shape, and lightened the page background.
- Added a JavaScript-rendered recent activity calendar that fetches current-user stats from the Memos API.
- Changed the custom calendar to a fixed 12-week, Monday-first, 84-cell grid.
- Kept future days in the current week as blank cells so the heatmap never ends with a partial isolated cell.
- Hid the native Memos single-month calendar when the custom calendar is active.
- Tuned calendar visual details: smaller cells, wider spacing, softer rounded corners, lighter green levels, and date-only hover titles.
- Added a subtle divider between the activity calendar and the quick navigation area.
- Hid the desktop left navigation rail and moved main destinations into the username hover menu.
- Added a sidebar identity block that reads the current user from `/api/v1/auth/me`.
- Added a username hover menu with links for all notes, explore, attachments, inbox, settings, and about.
- Moved the search bar into the upper-right content header and aligned it with the current view title.
- Changed the search placeholder to `Ctrl+K`.
- Added global shortcuts: `Ctrl/Cmd+K` focuses search, and `Ctrl/Cmd+N` focuses the new memo editor.
- Added flomo-style quick links for all notes, WeChat input, daily review, AI insight, and random walk.
- Added consistent SVG icon slots for sidebar quick links.
- Normalized editor helper button dimensions so media, text, list, and mention controls align cleanly.
- Debounced the MutationObserver scan path with `requestAnimationFrame` to avoid repeated tight DOM scan loops.
- Preserved the theme-only approach: no Memos source files are patched.
