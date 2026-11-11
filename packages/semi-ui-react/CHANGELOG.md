# @fibrae/semi-ui-react

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
    - @fibrae/semi-foundation@0.6.0
    - @fibrae/semi-icons-react@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [26c215d]
    - @fibrae/semi-icons-react@0.5.0
    - @fibrae/semi-foundation@0.5.0

## 0.4.0

### Minor Changes

- cc2514e: Form 改为只提供具名导出（破坏性），`Form` 不再挂静态成员：`Form.Input` 等字段改为 `FormInput` 至 `FormPinCode`，`Form.Section`、`Form.Label`、`Form.ErrorMessage`、`Form.Slot`、`Form.InputGroup` 改为 `FormSection`、`FormLabel`、`FormErrorMessage`、`FormSlot`、`FormInputGroup`，`Form.useForm`、`Form.SchemaField` 改为 `useForm`、`SchemaField`。新增类型导出 `FormErrorMessageProps`。
- 7cd2518: Form 新增 `schema` 属性，接受 Zod、Valibot、ArkType 等实现了 Standard Schema 的校验对象，与字段的 `validator`、`rules` 及 Form 的 `validator` 互斥；字段首次挂载时显示已有的错误，整表 `reset()` 清空全部错误
- d1cdb20: Form 校验升级（破坏性）：错误一律为 `string[]`；删除 async-validator，`rules` 由自带规则引擎执行，默认文案来自语言包；字段 `rules` 与 `validator` 互斥，`validator` 可传 Standard Schema；`keepState` 默认开启并支持 ArrayField；有 `schema` 时必填星号只看 `label.required`；`FormApi` 区分输入与输出类型。新增 `schemaDebounce`、ArrayField 的 `move`、SchemaField 与 SchemaForm
- 58996a3: 深路径调整（破坏性），包入口的导出不变。foundation 的组件目录移入 `components/`，如 `@fibrae/semi-foundation/button/button.scss` 改为 `@fibrae/semi-foundation/components/button/button.scss`；UI 与 AI 包的组件深路径不变，`_base/*`、`_utils/*` 等子路径改为 `base/*`、`utils/*` 与各框架的 hook 目录，AI 组件的子组件移入 `widgets/`；单个图标与插画的深路径改为导出名的 kebab-case，如 `@fibrae/semi-icons-react/icons/IconHome` 改为 `@fibrae/semi-icons-react/icons/icon-home`、`@fibrae/semi-illustrations-react/IllustrationNoContent` 改为 `@fibrae/semi-illustrations-react/illustration-no-content`；`@fibrae/semi-animation/styles/viewTransition.css` 改为 `@fibrae/semi-animation/styles/view-transition.css`。完整列表见 `docs/release-notes.md`。

### Patch Changes

- Updated dependencies [7cd2518]
- Updated dependencies [d1cdb20]
- Updated dependencies [58996a3]
    - @fibrae/semi-foundation@0.4.0
    - @fibrae/semi-icons-react@0.4.0
    - @fibrae/semi-illustrations-react@0.4.0

## 0.3.1

### Patch Changes

- @fibrae/semi-foundation@0.3.1
    - @fibrae/semi-icons-react@0.3.1
    - @fibrae/semi-illustrations-react@0.3.1

## 0.3.0

### Minor Changes

- b132487: Banner（破坏性）：根元素不再固定 `role="alert"`，默认不设 `role`，传入的 `role` 落在根元素上。依赖读屏立即播报的场景要自己传 `role="alert"`。
- 22fcbb6: React Checkbox：`onChange` 事件的 `nativeEvent` 改为原生点击事件 `MouseEvent`（空格切换也是点击事件），可读 `shiftKey` 等修饰键，与其他框架一致。
- 22fcbb6: Table 行选择支持 Shift 范围选择：按住 Shift 点击选择框（`clickRow` 时也可点击行，或在选择框上按 Shift+Space），把锚点到当前行之间的当前页可见行设成锚点的选中状态，跳过禁用行。范围选择只调用一次 `onChange`，不调用 `onSelect`；`checkRelation` 为 `'related'` 时按普通点击处理。

### Patch Changes

- Updated dependencies [22fcbb6]
    - @fibrae/semi-foundation@0.3.0
    - @fibrae/semi-icons-react@0.3.0
    - @fibrae/semi-illustrations-react@0.3.0

## 0.2.0

### Minor Changes

- 8e29d26: 修复多框架组件缺陷，含两项破坏性变化。

    破坏性变化

    - Solid Carousel：每张幻灯片外包一层组件自己的元素，不再改写使用方元素；幻灯片要撑满轮播区域需自己设置 `height: 100%`。
    - Feedback（四个框架）：`textAreaProps`、`radioGroupProps`、`checkboxGroupProps` 的类型去掉 `value`（Vue 为 `modelValue`），传入的值不再覆盖 Feedback 的值。

    修复与新增

    - Table：传 `groupBy` 时服务端首帧已含分组行；Vue 子列的 `defaultSortOrder`、`defaultFilteredValue` 在服务端首帧生效。
    - ResizeGroup（React、Vue、Svelte）：中途插入的项按 DOM 顺序登记。
    - Transfer（四个框架）：根元素不再带 `aria-required`，必填的 Form.Transfer 不再违反 ARIA。
    - React：Form.InputGroup、Carousel、Layout 展开 Fragment 子元素；Popconfirm 切换 `disabled` 不再重新挂载触发器。
    - Vue：Select 模板里不带值的 `multiple` 按多选渲染；插槽不在 render 外调用。
    - Solid：Select、TreeSelect、Cascader、TagInput、AutoComplete 插槽内的控件不再继承 InputGroup 的尺寸与禁用；Sidebar 只在挂载时创建 header 与 detail。
    - Svelte：IconButton 继承 InputGroup；Nav、Tree 的绑定值改回 `undefined` 时清空；多个组件组合使用方事件；Form 字段组件新增 `getControl()`；Chat 代码块高亮。

### Patch Changes

- Updated dependencies [8e29d26]
    - @fibrae/semi-foundation@0.2.0
    - @fibrae/semi-icons-react@0.2.0
    - @fibrae/semi-illustrations-react@0.2.0

## 0.1.1

### Patch Changes

- @fibrae/semi-foundation@0.1.1
    - @fibrae/semi-icons-react@0.1.1
    - @fibrae/semi-illustrations-react@0.1.1
