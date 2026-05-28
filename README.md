# memos-flomo-theme

A lightweight flomo-inspired theme for [Memos](https://github.com/usememos/memos), designed to work through Memos' built-in **Additional style** and **Additional script** settings.

[Chinese README](./README.zh-CN.md)

## Preview

Place your screenshots at the paths below and they will render here:

![Sidebar and editor preview](./assets/sidebar-editor.png)

![Memo list preview](./assets/memo-list.png)

## What This Theme Changes

- Applies a restrained flomo-like green palette with lighter surfaces, softer borders, and calmer hover states.
- Uses a Chinese-friendly sans-serif stack: `BarlowF, "PingFang SC", "Microsoft YaHei", Helvetica, Arial, sans-serif`.
- Makes the desktop layout more compact, with the sidebar and content area visually closer together.
- Hides the desktop left navigation rail and moves its main entries into a username hover menu.
- Moves search to the upper-right content header, aligned with the current view title.
- Shows the current username at the top of the sidebar.
- Replaces the original month calendar with a 12-week, Monday-first, 84-cell recent activity heatmap.
- Uses lighter calendar colors, compact square-ish cells, controlled spacing, and date-only hover titles.
- Adds a flomo-style quick navigation area for All Notes, Inbox, Daily Review, AI Insight, and Random Walk.
- Uses consistent icon slots for sidebar quick links.
- Converts tag display into a vertical list and indents nested tags such as `life/books`.
- Expands the editor when focused, then shrinks it back when focus leaves.
- Adds optional editor helper buttons for tags, media upload, bold, bullet lists, ordered lists, and mentions.
- Normalizes editor helper button sizing.
- Adds Markdown keyboard shortcuts such as `Ctrl/Cmd+B` for bold and list shortcuts.
- Adds global shortcuts: `Ctrl/Cmd+K` focuses memo search, and `Ctrl/Cmd+N` focuses the new memo editor.

## Files

- `flomo-additional-style.css`: paste into Memos **Settings -> System -> Additional style**.
- `flomo-additional-script.js`: paste into Memos **Settings -> System -> Additional script**.
- `memos/`: ignored reference copy of the upstream Memos source code.

## Install

1. Open Memos as an admin.
2. Go to **Settings -> System**.
3. Paste `flomo-additional-style.css` into **Additional style**.
4. Paste `flomo-additional-script.js` into **Additional script**.
5. Save and refresh the page.

## Change Log

### Current UI refresh

- Added a JavaScript-rendered recent activity calendar that fetches user stats through the Memos API.
- Changed the activity calendar to a fixed 12-week, 84-cell grid, with each column representing Monday through Sunday.
- Removed the original single-month calendar from the sidebar when the custom calendar is active.
- Tuned calendar cells to be smaller, lighter, more rounded, and more widely spaced.
- Changed calendar hover titles to show only the date.
- Added a subtle divider between the calendar and quick links.
- Hid the desktop left navigation rail and moved the main navigation destinations into a username hover menu.
- Added a sidebar username identity block populated from `/api/v1/auth/me`.
- Moved the search bar to the content header and changed its placeholder to `Ctrl+K`.
- Added `Ctrl/Cmd+K` for search focus and `Ctrl/Cmd+N` for new memo editor focus.
- Added flomo-like quick links with consistent SVG icon slots.
- Normalized editor helper button dimensions.
- Centered the sidebar and content column as a unified layout.

## Notes

This theme intentionally avoids patching Memos source code, so it should keep working with official Docker updates more easily. Some selectors may still need small adjustments when upstream Memos changes its DOM structure.
