# memos-flomo-theme

这是一个受 flomo 启发的 [Memos](https://github.com/usememos/memos) 轻量主题，尽量只通过 Memos 自带的 **Additional style** 和 **Additional script** 实现，方便继续跟随官方 Docker 更新。

[English README](./README.md)

## 预览

把你的两张截图放到下面路径后，README 会自动显示：

![侧边栏与编辑器预览](./assets/sidebar-editor.png)

![笔记列表预览](./assets/memo-list.png)

## 这个主题做了哪些美化

- 使用克制、轻盈的 flomo 风格绿色配色，降低边框、阴影和 hover 的侵入感。
- 全局字体改为更适合中文阅读的黑体栈：`BarlowF, "PingFang SC", "Microsoft YaHei", Helvetica, Arial, sans-serif`。
- 优化桌面端布局，让侧边栏和正文区域更紧凑、更贴近 flomo 的 Web UI。
- 将日历改成类似热力图的月份视图，用不同深浅的绿色表示笔记活跃度。
- 增加 flomo 风格快捷入口，包括全部笔记、微信输入、每日回顾、去年今日、随机漫步。
- 标签改成竖排展示，并对 `life/books` 这类子标签做缩进。
- 编辑器获得焦点时自动放大，失去焦点后恢复默认高度。
- 通过可选 JS 增加编辑器辅助按钮：标签、媒体上传、加粗、无序列表、有序列表、提及。
- 增加 Markdown 快捷键，例如 `Ctrl/Cmd+B` 加粗，以及列表相关快捷键。

## 文件说明

- `flomo-additional-style.css`：粘贴到 Memos **Settings -> System -> Additional style**。
- `flomo-additional-script.js`：粘贴到 Memos **Settings -> System -> Additional script**。
- `memos/`：被 Git 忽略的上游 Memos 源码参考副本。

## 安装方式

1. 以管理员身份打开 Memos。
2. 进入 **Settings -> System**。
3. 将 `flomo-additional-style.css` 粘贴到 **Additional style**。
4. 将 `flomo-additional-script.js` 粘贴到 **Additional script**。
5. 保存并刷新页面。

## 说明

这个主题刻意不修改 Memos 源码，因此更容易跟随官方 Docker 更新。不过如果上游 Memos 调整了页面 DOM 结构，部分 CSS 选择器可能需要同步微调。
