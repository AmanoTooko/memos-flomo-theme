/*
  Optional companion script for the flomo-like CSS.
  Paste into: Settings -> System -> Additional script

  What it does:
  - adds stable helper classes to the memo editor for CSS targeting
  - injects inline quick tools beside the existing plus button
  - supports quick insert for: #, image upload, bold, bullet list, ordered list, @mention
  - replaces the single-month sidebar calendar with a recent multi-month heatmap

  What it does NOT do:
  - replace Memos editor logic
  - recreate flomo-only proprietary interactions
*/

(() => {
  const ROOT_FLAG = "data-flomo-enhanced";
  document.documentElement.setAttribute("data-flomo-js", "loading");
  window.__MEMOS_FLOMO_JS__ = true;

  const zhMonths = [
    "\u4e00\u6708",
    "\u4e8c\u6708",
    "\u4e09\u6708",
    "\u56db\u6708",
    "\u4e94\u6708",
    "\u516d\u6708",
    "\u4e03\u6708",
    "\u516b\u6708",
    "\u4e5d\u6708",
    "\u5341\u6708",
    "\u5341\u4e00\u6708",
    "\u5341\u4e8c\u6708",
  ];
  const enMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const readNumberSetting = (name, fallback) => {
    const value = Number(window[name]);
    return Number.isFinite(value) ? value : fallback;
  };
  const CALENDAR_WEEK_COUNT = Math.max(1, Math.floor(readNumberSetting("__MEMOS_FLOMO_CALENDAR_WEEKS__", 12)));
  const CALENDAR_ROLLING_DAYS = CALENDAR_WEEK_COUNT * 7;
  const CALENDAR_CACHE_MS = 60 * 1000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const TOKEN_KEY = "memos_access_token";
  const TOKEN_EXPIRES_KEY = "memos_token_expires_at";
  let calendarStatsPromise = null;
  let currentUserPromise = null;
  let calendarStatsCachedAt = 0;
  let scanScheduled = false;

  const triggerInput = (textarea) => {
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    textarea.focus();
  };

  const insertText = (textarea, before, after = "", placeholder = "") => {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const current = textarea.value ?? "";
    const selected = current.slice(start, end);
    const content = selected || placeholder;
    const nextValue = `${current.slice(0, start)}${before}${content}${after}${current.slice(end)}`;

    textarea.value = nextValue;

    const nextStart = start + before.length;
    const nextEnd = nextStart + content.length;
    textarea.setSelectionRange(nextStart, nextEnd);
    triggerInput(textarea);
  };

  const insertRaw = (textarea, value) => {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const current = textarea.value ?? "";
    textarea.value = `${current.slice(0, start)}${value}${current.slice(end)}`;
    const cursor = start + value.length;
    textarea.setSelectionRange(cursor, cursor);
    triggerInput(textarea);
  };

  const createToolButton = ({ label, title, kind, onClick }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memos-flomo-inline-tool";
    button.dataset.kind = kind;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.textContent = label;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    return button;
  };

  const iconPaths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path><path d="M8 9h8"></path><path d="M8 13h5"></path>',
    sparkles: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"></path><path d="M5 15l.9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9z"></path><path d="M19 13l.7 1.6L21 15l-1.3.4L19 17l-.7-1.6L17 15l1.3-.4z"></path>',
    circle: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="2"></circle>',
    footprints: '<path d="M8 13c-1.6 0-2.5-1.4-2.5-3.2S6.4 6.5 8 6.5s2.5 1.4 2.5 3.3S9.6 13 8 13z"></path><path d="M16 17.5c-1.6 0-2.5-1.4-2.5-3.2s.9-3.3 2.5-3.3 2.5 1.4 2.5 3.3-.9 3.2-2.5 3.2z"></path><path d="M6 17h.01"></path><path d="M10 19h.01"></path><path d="M14 6h.01"></path><path d="M18 8h.01"></path>',
  };

  const createIcon = (name) => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = iconPaths[name] || iconPaths.circle;
    return icon;
  };

  const buildInlineTools = (textarea, fileInput) => {
    const container = document.createElement("div");
    container.className = "memos-flomo-inline-tools";

    const addSeparator = () => {
      const sep = document.createElement("span");
      sep.className = "memos-flomo-inline-sep";
      container.appendChild(sep);
    };

    container.appendChild(
      createToolButton({
        label: "#",
        title: "Insert tag",
        kind: "tag",
        onClick: () => insertRaw(textarea, "#"),
      }),
    );

    container.appendChild(
      createToolButton({
        label: "IMG",
        title: "Upload image or video",
        kind: "media",
        onClick: () => {
          fileInput.accept = "image/*,video/*";
          fileInput.click();
        },
      }),
    );

    addSeparator();

    container.appendChild(
      createToolButton({
        label: "Aa",
        title: "Bold selection",
        kind: "strong",
        onClick: () => insertText(textarea, "**", "**", "bold"),
      }),
    );

    container.appendChild(
      createToolButton({
        label: "-",
        title: "Insert bullet list",
        kind: "list",
        onClick: () => insertRaw(textarea, "- "),
      }),
    );

    container.appendChild(
      createToolButton({
        label: "1.",
        title: "Insert ordered list",
        kind: "ordered",
        onClick: () => insertRaw(textarea, "1. "),
      }),
    );

    addSeparator();

    container.appendChild(
      createToolButton({
        label: "@",
        title: "Insert mention",
        kind: "mention",
        onClick: () => insertRaw(textarea, "@"),
      }),
    );

    return container;
  };

  const bindKeyboardShortcuts = (textarea) => {
    if (textarea.dataset.flomoKeysBound === "true") {
      return;
    }

    textarea.dataset.flomoKeysBound = "true";
    textarea.addEventListener("keydown", (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "b") {
        event.preventDefault();
        insertText(textarea, "**", "**", "bold");
        return;
      }

      if (key === "i") {
        event.preventDefault();
        insertText(textarea, "*", "*", "italic");
        return;
      }

      if (event.shiftKey && key === "8") {
        event.preventDefault();
        insertRaw(textarea, "- ");
        return;
      }

      if (event.shiftKey && key === "7") {
        event.preventDefault();
        insertRaw(textarea, "1. ");
        return;
      }

      if (event.shiftKey && key === "9") {
        event.preventDefault();
        insertRaw(textarea, "- [ ] ");
      }
    });
  };

  const enhanceEditor = (editorShell) => {
    const root = editorShell.closest("div.group.relative.w-full.flex.flex-col.justify-between.items-start");
    const toolbar = root?.querySelector("div.w-full.flex.flex-row.justify-between.items-center.mb-2");
    const leftGroup = toolbar?.querySelector("div.flex.flex-row.justify-start.items-center");
    const fileInput = root?.querySelector('input[type="file"]');
    const textarea = editorShell.querySelector("textarea");

    if (!root || !toolbar || !leftGroup || !fileInput || !textarea) {
      return;
    }

    if (root.getAttribute(ROOT_FLAG) === "true") {
      bindKeyboardShortcuts(textarea);
      return;
    }

    root.setAttribute(ROOT_FLAG, "true");
    root.classList.add("memos-flomo-editor");
    toolbar.classList.add("memos-flomo-editor-toolbar");
    bindKeyboardShortcuts(textarea);

    if (!leftGroup.querySelector(".memos-flomo-inline-tools")) {
      leftGroup.appendChild(buildInlineTools(textarea, fileInput));
    }
  };

  const normalizeMonthLabel = (text) => {
    const value = text.trim();
    const zhMatch = value.match(new RegExp("(?:\\d{4}\\s*\\u5e74\\s*)?(\\d{1,2})\\s*\\u6708"));
    if (zhMatch) {
      const monthIndex = Number(zhMatch[1]) - 1;
      return zhMonths[monthIndex] || value;
    }

    const enMatch = value.match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i,
    );
    if (enMatch) {
      const month = enMonths.find((name) => name.toLowerCase() === enMatch[1].toLowerCase());
      return month || value;
    }

    return value;
  };

  const enhanceMonthLabels = () => {
    document.querySelectorAll("aside header button[type='button']").forEach((button) => {
      const nextLabel = normalizeMonthLabel(button.textContent || "");
      if (nextLabel && button.textContent !== nextLabel) {
        button.textContent = nextLabel;
      }
    });
  };

  const createQuickLink = ({ label, icon, href, active }) => {
    const link = document.createElement("a");
    link.className = `memos-flomo-quick-link${active ? " is-active" : ""}`;
    link.href = href;

    if (icon) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "memos-flomo-quick-link-icon";
      iconSpan.appendChild(createIcon(icon));
      link.appendChild(iconSpan);
    }

    const labelSpan = document.createElement("span");
    labelSpan.textContent = label;
    link.appendChild(labelSpan);
    return link;
  };

  const ensureSidebarDivider = (explorerBody, anchor) => {
    let divider = explorerBody.querySelector(":scope > .memos-flomo-sidebar-divider");
    if (!divider) {
      divider = document.createElement("div");
      divider.className = "memos-flomo-sidebar-divider";
      divider.setAttribute("aria-hidden", "true");
    }

    if (anchor && anchor !== divider && anchor.nextElementSibling !== divider) {
      anchor.insertAdjacentElement("afterend", divider);
    } else if (!divider.parentElement) {
      explorerBody.appendChild(divider);
    }

    return divider;
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDisplayTimeHref = (date) => `/?filter=${encodeURIComponent(`displayTime:${formatLocalDate(date)}`)}`;

  const cloneDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const addDays = (date, days) => {
    const next = cloneDate(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const addMonths = (date, months) => {
    const next = cloneDate(date);
    next.setMonth(next.getMonth() + months);
    return next;
  };

  const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

  const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const startOfWeek = (date) => addDays(date, -((date.getDay() + 6) % 7));

  const endOfWeek = (date) => addDays(startOfWeek(date), 6);

  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const getStoredToken = () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  };

  const storeToken = (token, expiresAt) => {
    if (!token) return;

    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (expiresAt) {
        localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt);
      }
    } catch {
      // Ignore storage failures; cookie based auth may still work.
    }
  };

  const refreshToken = async () => {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const payload = await response.json();
    storeToken(payload.accessToken || payload.access_token, payload.expiresAt || payload.expires_at);
    return payload.accessToken || payload.access_token || null;
  };

  const fetchJson = async (path, options = {}) => {
    const { retryAuth = true, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers || {});
    headers.set("Accept", "application/json");
    const token = getStoredToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(path, {
      ...fetchOptions,
      credentials: "include",
      headers,
    });

    if (response.status === 401 && retryAuth) {
      const nextToken = await refreshToken();
      const retryHeaders = new Headers(headers);
      if (nextToken) {
        retryHeaders.set("Authorization", `Bearer ${nextToken}`);
      }

      return fetchJson(path, {
        ...fetchOptions,
        headers: retryHeaders,
        retryAuth: false,
      });
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.status === 204 ? {} : response.json();
  };

  const getCalendarTimeBasis = () => {
    try {
      const cached = JSON.parse(localStorage.getItem("memos-view-setting") || "{}");
      const value = cached.timeBasis || cached.sortTimeField;
      return value === "update_time" ? "update_time" : "create_time";
    } catch {
      return "create_time";
    }
  };

  const getStatsTimestamps = (stats) => {
    const created = stats.memoCreatedTimestamps || stats.memo_created_timestamps || [];
    const updated = stats.memoUpdatedTimestamps || stats.memo_updated_timestamps || [];

    if (getCalendarTimeBasis() === "update_time" && updated.length > 0) {
      return updated;
    }

    return created;
  };

  const timestampToDate = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp === "string") {
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof timestamp.seconds !== "undefined") {
      const date = new Date(Number(timestamp.seconds) * 1000 + Math.floor(Number(timestamp.nanos || 0) / 1000000));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
  };

  const loadCalendarStats = () => {
    const now = Date.now();
    if (calendarStatsPromise && now - calendarStatsCachedAt < CALENDAR_CACHE_MS) {
      return calendarStatsPromise;
    }

    calendarStatsCachedAt = now;
    calendarStatsPromise = (async () => {
      const current = await loadCurrentUser();
      const userName = current?.user?.name;
      const userId = userName?.replace(/^users\//, "");

      if (!userId) {
        throw new Error("Current user is not available");
      }

      return fetchJson(`/api/v1/users/${encodeURIComponent(userId)}:getStats`);
    })().catch((error) => {
      calendarStatsPromise = null;
      calendarStatsCachedAt = 0;
      throw error;
    });

    return calendarStatsPromise;
  };

  const loadCurrentUser = () => {
    if (!currentUserPromise) {
      currentUserPromise = fetchJson("/api/v1/auth/me").catch((error) => {
        currentUserPromise = null;
        throw error;
      });
    }

    return currentUserPromise;
  };

  const createCalendarRange = () => {
    const today = cloneDate(new Date());
    const gridEnd = endOfWeek(today);
    const gridStart = addDays(gridEnd, -(CALENDAR_ROLLING_DAYS - 1));
    const rangeStart = gridStart;
    const rangeEnd = gridEnd;
    const dates = [];

    for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 1)) {
      dates.push(cloneDate(cursor));
    }

    return { today, rangeStart, rangeEnd, dates };
  };

  const countStatsByDate = (stats) => {
    const counts = {};
    const dates = [];

    getStatsTimestamps(stats).forEach((timestamp) => {
      const date = timestampToDate(timestamp);
      if (!date) return;

      dates.push(date);
      const key = formatLocalDate(date);
      counts[key] = (counts[key] || 0) + 1;
    });

    return { counts, dates };
  };

  const createStatItem = (value, label) => {
    const item = document.createElement("div");
    item.className = "memos-flomo-calendar-stat";

    const valueNode = document.createElement("strong");
    valueNode.textContent = String(value);

    const labelNode = document.createElement("span");
    labelNode.textContent = label;

    item.append(valueNode, labelNode);
    return item;
  };

  const createCalendarCell = ({ date, counts, maxCount, rangeStart, rangeEnd, today }) => {
    const key = formatLocalDate(date);
    const count = counts[key] || 0;
    const inRange = date >= rangeStart && date <= rangeEnd;
    const isFuture = date > today;
    const ratio = maxCount > 0 ? count / maxCount : 0;
    const level = count === 0 ? 0 : ratio > 0.66 ? 4 : ratio > 0.42 ? 3 : ratio > 0.18 ? 2 : 1;
    const node = inRange && !isFuture ? document.createElement("a") : document.createElement("span");

    node.className = `memos-flomo-calendar-cell level-${level}${inRange ? "" : " is-outside"}${key === formatLocalDate(today) ? " is-today" : ""}`;
    node.title = key;
    node.setAttribute("aria-label", key);

    if (node.tagName === "A") {
      node.href = getDisplayTimeHref(date);
    }

    return node;
  };

  const createCalendarMonthLabels = (dates, rangeStart, rangeEnd) => {
    const labels = document.createElement("div");
    labels.className = "memos-flomo-calendar-month-labels";

    const seen = new Set();
    dates.forEach((date, index) => {
      if (date < rangeStart || date > rangeEnd) return;

      const key = monthKey(date);
      const isMonthStart = date.getDate() === 1 || formatLocalDate(date) === formatLocalDate(rangeStart);
      if (!isMonthStart) return;
      if (seen.has(key)) return;
      seen.add(key);

      const label = document.createElement("span");
      label.textContent = zhMonths[date.getMonth()];
      label.style.gridColumn = `${Math.floor(index / 7) + 1} / span 4`;
      labels.appendChild(label);
    });

    return labels;
  };

  const renderCalendar = (calendar, stats = {}) => {
    const { today, rangeStart, rangeEnd, dates } = createCalendarRange();
    const { counts, dates: memoDates } = countStatsByDate(stats);
    const tagCount = Object.keys(stats.tagCount || stats.tag_count || {}).length;
    const totalMemoCount = stats.totalMemoCount || stats.total_memo_count || memoDates.length;
    const firstMemoDate = memoDates.length > 0 ? new Date(Math.min(...memoDates.map((date) => date.getTime()))) : null;
    const daySpan = firstMemoDate ? Math.floor((today.getTime() - cloneDate(firstMemoDate).getTime()) / DAY_MS) + 1 : 0;
    const maxCount = Math.max(1, ...Object.values(counts));
    const columns = Math.ceil(dates.length / 7);
    const summary = document.createElement("div");
    const grid = document.createElement("div");

    calendar.textContent = "";
    calendar.className = "memos-flomo-calendar";
    calendar.dataset.flomoLoadedAt = String(Date.now());
    calendar.setAttribute("aria-label", "Recent memo calendar");
    calendar.style.setProperty("--flomo-calendar-columns", String(columns));

    summary.className = "memos-flomo-calendar-summary";
    summary.append(
      createStatItem(totalMemoCount, "\u7b14\u8bb0"),
      createStatItem(tagCount, "\u6807\u7b7e"),
      createStatItem(daySpan, "\u5929"),
    );

    grid.className = "memos-flomo-calendar-grid";
    grid.style.setProperty("--flomo-calendar-columns", String(columns));
    dates.forEach((date) => {
      grid.appendChild(createCalendarCell({ date, counts, maxCount, rangeStart, rangeEnd, today }));
    });

    calendar.append(summary, grid);
  };

  const findNativeStatistics = (explorerBody) => {
    const direct = explorerBody.querySelector(":scope > .group.w-full.mt-2");
    if (direct?.querySelector('[role="grid"][aria-label^="Calendar for"]')) {
      return direct;
    }

    const nativeGrid = explorerBody.querySelector('[role="grid"][aria-label^="Calendar for"]');
    if (!nativeGrid) return null;

    return Array.from(explorerBody.children).find((child) => child.contains(nativeGrid)) || nativeGrid.closest(".group") || nativeGrid.parentElement;
  };

  const enhanceCalendar = () => {
    const aside = document.querySelector("aside");
    const explorerBody = aside?.querySelector(":scope > div.mt-1");
    if (!aside || !explorerBody) return;

    const nativeStats = findNativeStatistics(explorerBody);
    const existing = explorerBody.querySelector(":scope > .memos-flomo-calendar");

    if (!nativeStats) {
      if (existing) {
        existing.remove();
      }
      return;
    }

    if (existing) {
      if (!nativeStats.classList.contains("memos-flomo-native-statistics")) {
        nativeStats.classList.add("memos-flomo-native-statistics");
      }
      const loadedAt = Number(existing.dataset.flomoLoadedAt || 0);
      if (existing.dataset.flomoRefreshing !== "true" && Date.now() - loadedAt > CALENDAR_CACHE_MS) {
        existing.dataset.flomoRefreshing = "true";
        loadCalendarStats()
          .then((stats) => renderCalendar(existing, stats))
          .catch(() => {})
          .finally(() => {
            delete existing.dataset.flomoRefreshing;
          });
      }
      return;
    }

    const calendar = document.createElement("section");
    calendar.className = "memos-flomo-calendar";
    calendar.dataset.flomoRefreshing = "true";
    renderCalendar(calendar);

    if (!nativeStats.classList.contains("memos-flomo-native-statistics")) {
      nativeStats.classList.add("memos-flomo-native-statistics");
    }
    if (nativeStats.previousElementSibling !== calendar) {
      nativeStats.insertAdjacentElement("beforebegin", calendar);
    }

    loadCalendarStats()
      .then((stats) => {
        renderCalendar(calendar, stats);
      })
      .catch(() => {})
      .finally(() => {
        delete calendar.dataset.flomoRefreshing;
      });
  };

  const enhanceQuickLinks = () => {
    const aside = document.querySelector("aside");
    const explorerBody = aside?.querySelector(":scope > div.mt-1");
    if (!aside || !explorerBody) {
      return;
    }

    const currentFilter = new URLSearchParams(location.search).get("filter") || "";
    const onThisDayHref = getDisplayTimeHref(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
    const currentPathSearch = `${location.pathname}${location.search}`;
    const items = [
      { label: "\u5168\u90e8\u7b14\u8bb0", icon: "grid", href: "/", active: location.pathname === "/" && !currentFilter },
      { label: "\u5fae\u4fe1\u8f93\u5165", icon: "message", href: "/inbox", active: location.pathname === "/inbox" },
      { label: "\u6bcf\u65e5\u56de\u987e", icon: "sparkles", href: "/shortcuts", active: location.pathname === "/shortcuts" },
      { label: "AI \u6d1e\u5bdf", icon: "circle", href: "/explore", active: location.pathname === "/explore" },
      { label: "\u968f\u673a\u6f2b\u6b65", icon: "footprints", href: onThisDayHref, active: currentPathSearch === onThisDayHref },
    ];

    let links = explorerBody.querySelector(".memos-flomo-quick-links");
    if (links) {
      links.querySelectorAll("a").forEach((link, index) => {
        const item = items[index];
        if (!item) return;

        link.href = item.href;
        link.classList.toggle("is-active", item.active);
      });
    } else {
      links = document.createElement("nav");
      links.className = "memos-flomo-quick-links";
      links.setAttribute("aria-label", "Quick filters");
      items.forEach((item) => links.appendChild(createQuickLink(item)));
    }

    const anchor =
      explorerBody.querySelector(":scope > .memos-flomo-calendar") ||
      explorerBody.querySelector(":scope > .group.w-full.mt-2") ||
      explorerBody.firstElementChild;
    const divider = ensureSidebarDivider(explorerBody, anchor);

    if (divider.nextElementSibling !== links) {
      divider.insertAdjacentElement("afterend", links);
    } else if (!links.parentElement) {
      explorerBody.appendChild(links);
    }
  };

  const findSearchShell = () =>
    document.querySelector(".memos-flomo-top-search") ||
    document.querySelector("aside > div.relative.w-full.h-auto.flex.flex-row.justify-start.items-center");

  const findContentColumn = () =>
    document.querySelector("main div.flex.flex-col.justify-start.w-full.max-w-2xl.mx-auto") ||
    document.querySelector("main > section[class*='@container'] > div[class*='min-w-0'][class*='flex-1'] > div[class*='mx-auto']");

  const enhanceHeaderSearch = () => {
    const searchShell = findSearchShell();
    const contentColumn = findContentColumn();
    if (!searchShell || !contentColumn) return;

    searchShell.classList.add("memos-flomo-top-search");
    const searchInput = searchShell.querySelector("input");
    if (searchInput) {
      searchInput.placeholder = "Ctrl+K";
      searchInput.setAttribute("aria-label", "Search memos");
    }

    let header = contentColumn.querySelector(":scope > .memos-flomo-content-header");
    if (!header) {
      header = document.createElement("div");
      header.className = "memos-flomo-content-header";
      contentColumn.insertAdjacentElement("afterbegin", header);
    }

    let title = header.querySelector(".memos-flomo-content-title");
    if (!title) {
      title = document.createElement("div");
      title.className = "memos-flomo-content-title";
      title.textContent = "\u5168\u90e8\u7b14\u8bb0";
      header.appendChild(title);
    }

    if (searchShell.parentElement !== header) {
      header.appendChild(searchShell);
    }
  };

  const enhanceSidebarIdentity = () => {
    const aside = document.querySelector("aside");
    const explorerBody = aside?.querySelector(":scope > div.mt-1");
    if (!aside || !explorerBody) return;

    let identity = aside.querySelector(":scope > .memos-flomo-sidebar-identity");
    if (!identity) {
      identity = document.createElement("div");
      identity.className = "memos-flomo-sidebar-identity";
      const label = document.createElement("span");
      label.className = "memos-flomo-sidebar-identity-label";
      label.textContent = "\u6211\u7684\u5907\u5fd8";
      identity.append(label, createIdentityMenu());
      explorerBody.insertAdjacentElement("beforebegin", identity);
    }

    if (!identity.querySelector(".memos-flomo-sidebar-identity-label")) {
      const text = identity.textContent?.trim() || "\u6211\u7684\u5907\u5fd8";
      identity.textContent = "";
      const label = document.createElement("span");
      label.className = "memos-flomo-sidebar-identity-label";
      label.textContent = text;
      identity.append(label);
    }

    if (!identity.querySelector(".memos-flomo-identity-menu")) {
      identity.appendChild(createIdentityMenu());
    }

    identity.querySelectorAll(".memos-flomo-identity-menu a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("is-active", location.pathname === href);
    });

    if (identity.dataset.flomoLoaded === "true") return;
    identity.dataset.flomoLoaded = "true";
    loadCurrentUser()
      .then((payload) => {
        const user = payload?.user || {};
        const name = user.displayName || user.nickname || user.username || user.name?.replace(/^users\//, "") || "\u6211\u7684\u5907\u5fd8";
        const label = identity.querySelector(".memos-flomo-sidebar-identity-label");
        if (label) {
          label.textContent = name;
        }
      })
      .catch(() => {
        identity.dataset.flomoLoaded = "false";
      });
  };

  const createIdentityMenu = () => {
    const menu = document.createElement("div");
    menu.className = "memos-flomo-identity-menu";
    [
      { label: "\u5168\u90e8\u7b14\u8bb0", href: "/" },
      { label: "\u63a2\u7d22", href: "/explore" },
      { label: "\u9644\u4ef6", href: "/attachments" },
      { label: "\u6536\u4ef6\u7bb1", href: "/inbox" },
      { label: "\u8bbe\u7f6e", href: "/setting" },
      { label: "\u5173\u4e8e", href: "/about" },
    ].forEach((item) => {
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      if (location.pathname === item.href) {
        link.className = "is-active";
      }
      menu.appendChild(link);
    });

    return menu;
  };

  const focusSearchInput = () => {
    const input = findSearchShell()?.querySelector("input");
    if (!input) return false;
    input.focus();
    input.select?.();
    return true;
  };

  const focusEditorInput = () => {
    const textarea =
      document.querySelector(".memo-editor-content textarea") ||
      document.querySelector("textarea[data-slot='textarea']") ||
      document.querySelector("textarea");
    if (!textarea) return false;
    textarea.focus();
    textarea.scrollIntoView?.({ block: "center", behavior: "smooth" });
    return true;
  };

  const bindGlobalShortcuts = () => {
    if (document.documentElement.dataset.flomoGlobalKeysBound === "true") return;
    document.documentElement.dataset.flomoGlobalKeysBound = "true";

    document.addEventListener("keydown", (event) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "k") {
        if (focusSearchInput()) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (key === "n") {
        if (focusEditorInput()) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    });
  };

  const getTagSections = () => {
    const aside = document.querySelector("aside");
    if (!aside) return [];

    return Array.from(aside.querySelectorAll("div")).filter((section) => {
      const header = section.firstElementChild;
      const label = header?.querySelector("span")?.textContent?.trim().toLowerCase();
      return label === "tags" || label === "\u6807\u7b7e" || label === "\u5168\u90e8\u6807\u7b7e";
    });
  };

  const enhanceTags = () => {
    getTagSections().forEach((section) => {
      section.classList.add("memos-flomo-tags-section");
      const tagList = Array.from(section.children).find((child) => child.className?.toString().includes("flex-wrap"));
      if (!tagList) return;

      tagList.querySelectorAll("div[class*='cursor-pointer']").forEach((item) => {
        const labelSpan = item.querySelector("span.truncate");
        if (!labelSpan) return;

        const original = item.dataset.flomoTagPath || labelSpan.textContent?.trim() || "";
        if (!original) return;

        const path = original.replace(/^#/, "");
        const parts = path.split("/").filter(Boolean);
        const depth = Math.max(0, parts.length - 1);
        const display = parts[parts.length - 1] || path;

        item.dataset.flomoTagPath = path;
        item.dataset.flomoTagDepth = String(depth);
        item.style.setProperty("--flomo-tag-depth", String(depth));
        item.classList.add("memos-flomo-tag-item");
        item.title = path;

        if (labelSpan.textContent !== display) {
          labelSpan.textContent = display;
        }
      });
    });
  };

  const scanEditors = () => {
    document.querySelectorAll(".memo-editor-content").forEach((editorShell) => enhanceEditor(editorShell));
  };

  const scanSidebar = () => {
    enhanceMonthLabels();
    enhanceCalendar();
    enhanceQuickLinks();
    enhanceTags();
    enhanceSidebarIdentity();
    enhanceHeaderSearch();
  };

  const runScans = () => {
    scanScheduled = false;
    scanEditors();
    scanSidebar();
  };

  const scheduleScans = () => {
    if (scanScheduled) return;
    scanScheduled = true;
    const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 16));
    schedule(runScans);
  };

  const observer = new MutationObserver(scheduleScans);

  scanEditors();
  scanSidebar();
  bindGlobalShortcuts();
  document.documentElement.setAttribute("data-flomo-js", "ready");
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
