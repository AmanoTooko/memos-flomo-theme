# memos-flomo-theme

这是一个受 flomo 启发的 [Memos](https://github.com/usememos/memos) 轻量主题，尽量只通过 Memos 自带的 **Additional style** 和 **Additional script** 实现，方便继续跟随官方 Docker 更新。

[English README](./README.md)

## 预览

把截图放到下面路径后，README 会自动显示：

![侧边栏与编辑器预览](./assets/sidebar-editor.png)

![笔记列表预览](./assets/memo-list.png)

## 这个主题做了什么

- 使用克制、轻量的 flomo 风格绿色配色，降低边框、阴影和 hover 的侵入感。
- 全局字体使用更适合中文阅读的字体栈：`BarlowF, "PingFang SC", "Microsoft YaHei", Helvetica, Arial, sans-serif`。
- 优化桌面端布局，让侧边栏和正文区域更贴近、整体更居中。
- 使用更接近 flomo 的宽侧边栏和受控正文宽度，避免编辑器与笔记卡片显得过宽。
- 隐藏桌面端最左侧导航 rail，把主要入口集中到用户名 hover 菜单。
- 将搜索栏移动到正文右上角，与当前视图标题对齐。
- 在侧边栏顶部显示当前用户名。
- 用最近 12 周、周一开始、固定 84 格的活动热力图替换原始单月日历。
- 日历使用更淡的颜色、偏方形的小格子、受控的格子间距，并且 hover 只显示日期。
- 增加 flomo 风格快捷入口：全部笔记、微信输入、每日回顾、AI 洞察、随机漫步。
- 统一侧边栏快捷入口的图标槽。
- 标签改成竖排展示，并对 `life/books` 这类子标签做缩进。
- 编辑器获得焦点时自动放大，失去焦点后恢复默认高度。
- 通过可选 JS 增加编辑器辅助按钮：标签、媒体上传、加粗、无序列表、有序列表、提及。
- 统一编辑器辅助按钮大小。
- 增加 Markdown 快捷键，例如 `Ctrl/Cmd+B` 加粗以及列表相关快捷键。
- 增加全局快捷键：`Ctrl/Cmd+K` 聚焦搜索备忘录，`Ctrl/Cmd+N` 聚焦新想法编辑器。

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

## 变更记录

### 当前 UI 刷新

- 增加通过 Memos API 拉取用户统计数据的 JS 自定义最近活动日历。
- 将活动日历改为固定 12 周、84 格，每一列代表一周，纵向按周一到周日排列。
- 自定义日历启用时隐藏原始单月日历。
- 调整日历格子：更小、更淡、更圆，间距更大。
- 日历 hover 提示改为只显示日期。
- 在日历和快捷入口之间增加轻量分割线。
- 隐藏桌面端最左侧导航 rail，并把主要导航目的地移动到用户名 hover 菜单。
- 增加侧边栏用户名区域，并从 `/api/v1/auth/me` 填充当前用户。
- 将搜索栏移动到正文 header，placeholder 改为 `Ctrl+K`。
- 增加 `Ctrl/Cmd+K` 聚焦搜索、`Ctrl/Cmd+N` 聚焦新想法编辑器。
- 增加带统一 SVG 图标槽的 flomo 风格快捷入口。
- 统一编辑器辅助按钮尺寸。
- 将侧边栏和正文栏作为整体进行居中排版。

## 说明

这个主题刻意不修改 Memos 源码，因此更容易跟随官方 Docker 更新。不过如果上游 Memos 调整了页面 DOM 结构，部分 CSS 选择器可能需要同步微调。
