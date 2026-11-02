# @fibrae/semi-ui-react

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
