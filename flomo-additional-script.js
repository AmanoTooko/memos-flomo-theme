/*
  Optional companion script for the flomo-like CSS.
  Paste into: Settings -> System -> Additional script

  What it does:
  - adds stable helper classes to the memo editor for CSS targeting
  - injects inline quick tools beside the existing plus button
  - supports quick insert for: #, image upload, bold, bullet list, ordered list, @mention

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
      iconSpan.textContent = icon;
      link.appendChild(iconSpan);
    }

    const labelSpan = document.createElement("span");
    labelSpan.textContent = label;
    link.appendChild(labelSpan);
    return link;
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDisplayTimeHref = (date) => `/?filter=${encodeURIComponent(`displayTime:${formatLocalDate(date)}`)}`;

  const enhanceQuickLinks = () => {
    const aside = document.querySelector("aside");
    const explorerBody = aside?.querySelector(":scope > div.mt-1");
    if (!aside || !explorerBody || explorerBody.querySelector(".memos-flomo-quick-links")) {
      return;
    }

    const links = document.createElement("nav");
    links.className = "memos-flomo-quick-links";
    links.setAttribute("aria-label", "Quick filters");

    [
      { label: "\u5168\u90e8\u7b14\u8bb0", icon: "", href: "/", active: location.pathname === "/" },
      { label: "\u5fae\u4fe1\u8f93\u5165", icon: "", href: "/inbox" },
      { label: "\u6bcf\u65e5\u56de\u987e", icon: "", href: "/shortcuts" },
      { label: "\u53bb\u5e74\u4eca\u65e5", icon: "", href: getDisplayTimeHref(new Date(new Date().setFullYear(new Date().getFullYear() - 1))) },
      { label: "\u968f\u673a\u6f2b\u6b65", icon: "", href: "/explore" },
    ].forEach((item) => links.appendChild(createQuickLink(item)));

    const firstSection = explorerBody.firstElementChild;
    if (firstSection) {
      firstSection.insertAdjacentElement("afterend", links);
    } else {
      explorerBody.appendChild(links);
    }
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
    enhanceQuickLinks();
    enhanceTags();
  };

  const observer = new MutationObserver(() => {
    scanEditors();
    scanSidebar();
  });

  scanEditors();
  scanSidebar();
  document.documentElement.setAttribute("data-flomo-js", "ready");
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
