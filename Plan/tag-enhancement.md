# 标签增强功能

## 需求

- [x] 标签树形缩进 - 子标签按层级缩进，默认隐藏
- [x] 标签计数 (N) - 从 API stats 获取 tagCount 显示
- [x] 展开/折叠 - # 号作为切换按钮，hover 变 ▼，点击展开/折叠
- [x] 默认视图 - 只显示顶层标签(depth=0)
- [x] 约束处理 - 无双重#，不删除parent前缀，防重入

## 实现方案

### JS (flomo-additional-script.js)
- `buildTagTree()`: 从平铺标签列表构建树结构
- `fetchTagCounts()`: 异步获取标签计数，防重入标记
- `enhanceTags()`: 主函数，处理DOM增强、排序、展开/折叠状态
- `tagExpandedSet`: 记录当前展开状态的Set
- `collapseDescendants()`: 折叠时递归收起所有子孙

### CSS (flomo-additional-style.css)
- `[data-flomo-tag-hidden="true"]` 隐藏折叠的子标签
- `.memos-flomo-tag-toggle` 切换按钮样式
- hover 时 `font-size:0` + `::after` 实现 # → ▼ 过渡
- `.memos-flomo-tag-count` 计数样式(右对齐、灰色)

## 状态

已完成开发，待实际环境验证。
