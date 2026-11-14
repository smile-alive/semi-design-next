# @fibrae/semi-ai-react

## 0.7.0

### Minor Changes

- d95d891: 内部元素的样式统一经 `classNames`、`styles` 设置（含破坏性变化），便于配合 Tailwind 工具类。

    - 破坏性：删除各组件的 `xxxClassName`、`xxxCls`、`xxxStyle` 部位属性（如 Card 的 `bodyStyle`、Select 的 `dropdownClassName`、Modal 的 `maskStyle`、Tabs 的 `tabBarClassName`），改用按部位名分键的 `classNames`、`styles`，部位名见各组件的 API 表格；部位类名追加在组件自带类名之后，根元素仍用 `className`（Vue、Solid、Svelte 为 `class`）与 `style`。
    - 破坏性：Spin 删除 `wrapperClassName`（与根元素的 `className` 重复）；Radio 的 `options` 项、Descriptions 的 `data` 项、Navigation 的 `items` 配置同样改用 `classNames`、`styles`。
    - 全局 `overrideDefaultProps` 里的 `classNames`、`styles` 是默认值，组件传入时整体替换；InputNumber 内部的 Input 不再读取 Input 的全局默认值。
    - Upload 的 `Upload.FileCard` 与 `renderFileItem` 参数新增类名，来自 `classNames.item`。
    - Select 开启 `ellipsisTrigger` 的多选可搜索时，打开后搜索框留在标签所在行。

- d95d891: 键盘与弹层的共用逻辑收进 foundation，四个框架的行为对齐（含破坏性变化）。

    - 弹层：Select、AutoComplete、Cascader、TreeSelect 与 AIChatDialogue「更多」菜单的点击外部改由弹层判断，mousedown 监听从 `document` 移到 `window`；打开回调执行前就被关闭的弹层成对报告 `onVisibleChange(true)`、`(false)`；出场动画期间重新打开时立即调用一次 `afterClose`。
    - 键盘：下拉打开时按 Tab 统一为关闭并前进到下一个元素（Select、DatePicker、TimePicker 的行为变化）；Select、AutoComplete、Cascader、TreeSelect、DatePicker、TimePicker 的触发器不再处理带 Ctrl、Meta 的按键，以及 Alt 加 ArrowDown、ArrowUp、Tab 以外的按键；Slider 的 Home、End 由组件处理；Cascader、TreeSelect 的方向键不再把焦点送进下拉里的输入框；焦点在 Cascader 插槽输入框里按 Esc 后回到触发器。
    - ARIA：Select、AutoComplete、DatePicker、TimePicker 的触发器只在面板打开时设置 `aria-controls`；Vue、Svelte 中显式传 `undefined` 的 `aria-label`、`aria-labelledby`、`aria-modal`、`aria-describedby` 按未传处理。
    - foundation（破坏性）：`TooltipAdapter` 新增必需的 `getNestedPopups()`、`batch(fn)`，Tree、TreeSelect 的 adapter 新增必需的 `revealRow(index, key)`；`ModalContentFoundation.show`、`hide` 改名为 `beforeShow`、`afterHide`；`@fibrae/semi-ai-foundation/utils/upload-status` 删除，改从 `@fibrae/semi-foundation/components/upload/utils` 导入。
    - 焦点与时机：ColorPicker 弹层打开时焦点进入面板；SideSheet 等离场动画结束才释放 inert、Tab 陷阱与滚动锁，`afterVisibleChange(true)` 改在进场动画结束后调用。
    - Pagination（破坏性）：根元素改为带名称的 `nav`，`class`、`style`、`ref` 与未声明属性落在 `nav` 上，原有类名留在内层 `ul`。
    - Form：字段组件标注纯调用，单独导入时可被摇掉。

    完整列表见 `docs/release-notes.md`。

### Patch Changes

- Updated dependencies [d95d891]
- Updated dependencies [d95d891]
    - @fibrae/semi-foundation@0.7.0
    - @fibrae/semi-ai-foundation@0.7.0
    - @fibrae/semi-ui-react@0.7.0
    - @fibrae/semi-icons-react@0.7.0

## 0.6.0

### Minor Changes

- 0639926: 组件逻辑继续收进 foundation，修复已确认的组件问题并清理公开 Props；完整的破坏性变化与行为变化见仓库的 `docs/release-notes.md`。

    - 破坏性：四个框架的 UI 包与 AI 包按 D18 整理组件目录，深路径随之变化；基础目录新增 `index` 入口。
    - 破坏性：语言包只内置 `zh_CN`、`en_US`，经 `/locale` 入口导出；语言包删除 `dateFnsLocale`，日期组件按 `code` 取 date-fns 语言。
    - 破坏性：DatePicker 设置 `timeZone` 时 `Date` 按时刻、字符串按该时区钟点处理；`onChange` 按 `type` 与 `multiple` 判别参数类型。
    - 破坏性：Icon 的公开 Props 删除 `prefixCls`；React 的 UI、AI、图标包 `dist` 模块（入口除外）带 `'use client'`，`createSvgComponent` 只能在 `'use client'` 文件中调用。
    - 破坏性：Grid 的 Row 一律 flex，Col 改用 CSS 变量；样式中的物理写法改为逻辑属性。
    - Lottie 默认 SVG 渲染器改用 lottie-web light 构建；`@fibrae/semi-vite-plugin` 为 Solid dev 预构建补上该深路径。
    - React：Server Component 传入的节点在 dev 下以 lazy 形态到达时先解开再使用；React、Solid 的 Tooltip 弹层支持 `aria-describedby`。
    - Cropper 在 RTL 下按左上角定位；修复首帧、hydration、输入法与弹层相关问题。

### Patch Changes

- Updated dependencies [0639926]
    - @fibrae/semi-ai-foundation@0.6.0
    - @fibrae/semi-foundation@0.6.0
    - @fibrae/semi-icons-react@0.6.0
    - @fibrae/semi-ui-react@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [26c215d]
    - @fibrae/semi-icons-react@0.5.0
    - @fibrae/semi-ui-react@0.5.0
    - @fibrae/semi-ai-foundation@0.5.0
    - @fibrae/semi-foundation@0.5.0

## 0.4.0

### Minor Changes

- 58996a3: 深路径调整（破坏性），包入口的导出不变。foundation 的组件目录移入 `components/`，如 `@fibrae/semi-foundation/button/button.scss` 改为 `@fibrae/semi-foundation/components/button/button.scss`；UI 与 AI 包的组件深路径不变，`_base/*`、`_utils/*` 等子路径改为 `base/*`、`utils/*` 与各框架的 hook 目录，AI 组件的子组件移入 `widgets/`；单个图标与插画的深路径改为导出名的 kebab-case，如 `@fibrae/semi-icons-react/icons/IconHome` 改为 `@fibrae/semi-icons-react/icons/icon-home`、`@fibrae/semi-illustrations-react/IllustrationNoContent` 改为 `@fibrae/semi-illustrations-react/illustration-no-content`；`@fibrae/semi-animation/styles/viewTransition.css` 改为 `@fibrae/semi-animation/styles/view-transition.css`。完整列表见 `docs/release-notes.md`。

### Patch Changes

- Updated dependencies [cc2514e]
- Updated dependencies [7cd2518]
- Updated dependencies [d1cdb20]
- Updated dependencies [58996a3]
    - @fibrae/semi-ui-react@0.4.0
    - @fibrae/semi-foundation@0.4.0
    - @fibrae/semi-ai-foundation@0.4.0
    - @fibrae/semi-icons-react@0.4.0
    - @fibrae/semi-illustrations-react@0.4.0

## 0.3.1

### Patch Changes

- @fibrae/semi-ai-foundation@0.3.1
    - @fibrae/semi-foundation@0.3.1
    - @fibrae/semi-icons-react@0.3.1
    - @fibrae/semi-illustrations-react@0.3.1
    - @fibrae/semi-ui-react@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [b132487]
- Updated dependencies [22fcbb6]
- Updated dependencies [22fcbb6]
    - @fibrae/semi-ui-react@0.3.0
    - @fibrae/semi-foundation@0.3.0
    - @fibrae/semi-ai-foundation@0.3.0
    - @fibrae/semi-icons-react@0.3.0
    - @fibrae/semi-illustrations-react@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [8e29d26]
    - @fibrae/semi-foundation@0.2.0
    - @fibrae/semi-ui-react@0.2.0
    - @fibrae/semi-ai-foundation@0.2.0
    - @fibrae/semi-icons-react@0.2.0
    - @fibrae/semi-illustrations-react@0.2.0

## 0.1.1

### Patch Changes

- @fibrae/semi-ai-foundation@0.1.1
    - @fibrae/semi-foundation@0.1.1
    - @fibrae/semi-icons-react@0.1.1
    - @fibrae/semi-illustrations-react@0.1.1
    - @fibrae/semi-ui-react@0.1.1
