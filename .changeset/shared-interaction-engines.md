---
'@fibrae/semi-foundation': minor
'@fibrae/semi-ai-foundation': minor
'@fibrae/semi-json-viewer-core': minor
'@fibrae/semi-ui-react': minor
'@fibrae/semi-ui-vue': minor
'@fibrae/semi-ui-solid': minor
'@fibrae/semi-ui-svelte': minor
'@fibrae/semi-ai-react': minor
'@fibrae/semi-ai-vue': minor
'@fibrae/semi-ai-solid': minor
'@fibrae/semi-ai-svelte': minor
---

键盘与弹层的共用逻辑收进 foundation，四个框架的行为对齐（含破坏性变化）。

- 弹层：Select、AutoComplete、Cascader、TreeSelect 与 AIChatDialogue「更多」菜单的点击外部改由弹层判断，mousedown 监听从 `document` 移到 `window`；打开回调执行前就被关闭的弹层成对报告 `onVisibleChange(true)`、`(false)`；出场动画期间重新打开时立即调用一次 `afterClose`。
- 键盘：下拉打开时按 Tab 统一为关闭并前进到下一个元素（Select、DatePicker、TimePicker 的行为变化）；Select、AutoComplete、Cascader、TreeSelect、DatePicker、TimePicker 的触发器不再处理带 Ctrl、Meta 的按键，以及 Alt 加 ArrowDown、ArrowUp、Tab 以外的按键；Slider 的 Home、End 由组件处理；Cascader、TreeSelect 的方向键不再把焦点送进下拉里的输入框；焦点在 Cascader 插槽输入框里按 Esc 后回到触发器。
- ARIA：Select、AutoComplete、DatePicker、TimePicker 的触发器只在面板打开时设置 `aria-controls`；Vue、Svelte 中显式传 `undefined` 的 `aria-label`、`aria-labelledby`、`aria-modal`、`aria-describedby` 按未传处理。
- foundation（破坏性）：`TooltipAdapter` 新增必需的 `getNestedPopups()`、`batch(fn)`，Tree、TreeSelect 的 adapter 新增必需的 `revealRow(index, key)`；`ModalContentFoundation.show`、`hide` 改名为 `beforeShow`、`afterHide`；`@fibrae/semi-ai-foundation/utils/upload-status` 删除，改从 `@fibrae/semi-foundation/components/upload/utils` 导入。
- 焦点与时机：ColorPicker 弹层打开时焦点进入面板；SideSheet 等离场动画结束才释放 inert、Tab 陷阱与滚动锁，`afterVisibleChange(true)` 改在进场动画结束后调用。
- Pagination（破坏性）：根元素改为带名称的 `nav`，`class`、`style`、`ref` 与未声明属性落在 `nav` 上，原有类名留在内层 `ul`。
- Form：字段组件标注纯调用，单独导入时可被摇掉。

完整列表见 `docs/release-notes.md`。
