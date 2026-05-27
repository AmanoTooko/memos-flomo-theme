# memos-flomo-theme

A lightweight flomo-inspired theme for [Memos](https://github.com/usememos/memos), designed to work through Memos' built-in **Additional style** and **Additional script** settings.

[中文说明](./README.zh-CN.md)

## Preview

Place your screenshots at the paths below and they will render here:

![Sidebar and editor preview](./assets/sidebar-editor.png)

![Memo list preview](./assets/memo-list.png)

## What This Theme Changes

- Applies a restrained flomo-like green palette with lighter surfaces, softer borders, and calmer hover states.
- Uses a Chinese-friendly sans-serif stack: `BarlowF, "PingFang SC", "Microsoft YaHei", Helvetica, Arial, sans-serif`.
- Makes the desktop layout more compact, with the sidebar and content area visually closer together.
- Restyles the calendar into a heatmap-like month view, using green intensity to suggest memo activity.
- Adds a flomo-style quick navigation area for All Notes, Inbox, Daily Review, On This Day, and Random Walk.
- Converts tag display into a vertical list and indents nested tags such as `life/books`.
- Expands the editor when focused, then shrinks it back when focus leaves.
- Adds optional editor helper buttons for tags, media upload, bold, bullet lists, ordered lists, and mentions.
- Adds Markdown keyboard shortcuts such as `Ctrl/Cmd+B` for bold and list shortcuts.

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

## Notes

This theme intentionally avoids patching Memos source code, so it should keep working with official Docker updates more easily. Some selectors may still need small adjustments when upstream Memos changes its DOM structure.
