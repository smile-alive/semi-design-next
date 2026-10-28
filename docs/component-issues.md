# 组件问题记录

本文记录 Semi Design Next 组件的未结问题、已知限制与保持原样的决定；问题修复后删除对应条目，使用方能感知的变化写进 `docs/release-notes.md`，修复历史用 git log 查。第 1 节按组件，第 2 节为不属于单个组件的类型与工具链问题，第 3 节为主题与站点；决策编号见 `docs/decisions.md` 第 1 节。

每条一句话：先写问题，句末写状态，括号内只写影响、处理方式或升级条件；只在某个框架包出现的问题以框架名开头（如「Vue：」）。同一组件的「保持原样」「不做」各合并为一条。

状态：

- 保持原样：原行为如此，重写没有改；括号内写原因。
- 待决：需要维护者决定；括号内写影响与解决条件。
- 待处理：问题成立，排入后续工作项；括号内写处理方式。
- 已知限制：当前实现的限制，括号内写升级条件。
- 不做：评估后决定不处理；括号内写原因。
- UNKNOWN：尚未核实；括号内写影响与解决条件。
- 待母语者复核：除 zh_CN、en_US 外的译文为机译，需要母语者复核。

## 1 已重写的组件

### Tag、TagGroup、SplitTagGroup

- TagGroup 中文字相同的标签移除前一个时，后一个错位到前一个实例上。已知限制（调用方需提供 `tagKey`）。
- 可点击 Tag 作触发器时，Modal 内按 Escape 关闭弹层后的焦点落点未验证。UNKNOWN（补 Modal 内的浏览器用例）。
- Solid：TagGroup 折叠（`maxTagCount`）后，标签在可见区与 +N 弹层之间移动时重新挂载，已关闭状态不保留（`renderTag` 重新调用）。已知限制（升级条件：需跨折叠边界保留状态时，把关闭状态提升到 TagGroup）。
- Solid：TagGroup 与 TagInput 的 +N 浮层是没有名称的 `role="dialog"`，打开时告警。待处理（按 locale-text 补一条「其余标签」文案作默认 `aria-label`，57 个语言包一起补；调用方可经 `popoverProps`、`restTagsPopoverProps` 传 `aria-label`）。

### Tooltip（及 Popover、Dropdown）

- 触发器被滚动祖先裁掉一部分时，按裁剪后的可见比例监测移动，只让它露出更多的移动不触发重新定位，要等下一次滚动、resize 或尺寸变化。已知限制（升级条件：有不跟随的实际场景时，对被裁剪的触发器在打开期间按 `requestAnimationFrame` 比较矩形）。
- 受控请求被拒后 `#requestedVisible` 保留到下一次 `visible` 变化，使用方之后自行设为该值时 hover、focus 触发跳过延时。已知限制（只影响时机；升级条件：需按延时生效）。
- React：UserGuide 手写成对的全局监听 add、remove。待处理（`measureSpotlight` 是 useEffectEvent，不能直接作 `useEventListener` 的 listener）。
- Tooltip 作为 `createPortal(…, shadowRoot)` 的直接子节点时弹层落到 body 而非该 ShadowRoot。待处理（根因未查；包一层 div 时正常）。
- Vue：`canCarryPopupState` 不识别 `nativeTag()` 生成的函数式组件，Dropdown 不补 `aria-haspopup`、`aria-expanded`，`sub-nav.vue` 手写 `role="button"` 变通。待处理（让 `nativeTag` 标记标签名并由 `canCarryPopupState` 读取，再删变通）。
- 离场动画中重新打开会跳过本次离场收尾，`afterClose` 不发出。待决（是否在 Tooltip 层补发事件；Select、TreeSelect 已处理，其他依赖 `afterClose` 的组件 UNKNOWN）。
- `Tooltip.handleEscape` 在 `trigger="custom"` 下认领 Esc 但不关闭。待处理（custom 触发的组件需各自接 `onEscKeyDown`，AIChatInput 已接）。
- 保持原样：Vue 内层 click 加 `stopPropagation` 时焦点仍转发到外层；Slider、Rating 传 `closeOnEsc={false}`；React 直接嵌套 Tooltip 家族不转交外层注入值。
- Vue：hover、focus 触发的弹层内打开 Modal、SideSheet 或图片预览后，指针移入该层会关闭外层。已知限制（升级条件：`use-tooltip.ts` 检查已登记后代）。
- React、Vue：在外部元素的 mousedown 处理中打开受控弹层或启用 `useClickOutside` 时，同一次按下是否被判为点击外部未验证（React 18 起离散事件的 effect 同步刷新）。UNKNOWN（影响：弹层一打开就被 `onClickOutSide` 关闭；解决条件：补真实浏览器用例，成立则忽略启用监听时正在派发的事件 `window.event`）。
- React `TooltipRuntime` 的 WeakRef 回收用例未写。UNKNOWN（嵌套弹层关闭后元素是否及时回收；开启 `--expose-gc` 后补用例）。
- Solid：触发器内部的非 Tooltip 家族组件渲染的弹层（未登记到 `TooltipPopupsContext`）算作外部，在其中按下鼠标会关闭 Tooltip，除非该弹层自己 `stopPropagation`。已知限制（升级条件：这类 Solid 组件落地时经 `useTooltipPopups()?.register` 登记自己的弹层）。
- Solid：原生 `<button disabled>` 与尚未移植的带 `disabled` 的组件不被识别为特殊触发器，内部设置 `role` 的组件作触发器时要在 `own` 中传 `role`。已知限制（升级条件：这些 Solid 组件落地时登记到 `SpecialTriggerContext`；多处需要 `role` 时改为在 effect 中读 DOM）。
- Solid：触发元素的字符串 `style` 在两次打开之间被重写时冲掉 `pointer-events`。已知限制（升级条件：有需求时监听 `style` 属性变化并补写）。
- Solid：非函数 children 的特殊触发器（disabled、loading 的 Button、Input 等）在 ref 回调中登记，服务端认不出，包裹 span 的 `cursor`、`width` 挂载后才补上（函数 children 展开 `getTriggerProps` 时，组件体内按其 ref 登记，服务端首帧已正确）。已知限制（升级条件：需要首帧样式时，服务端改为按 Tooltip 解析的子项身份查找登记）。
- Solid：非函数 children 的 span 在 `onMount` 中才确定 `tabindex`，首帧是否短暂出现两个 Tab 停靠点未验证。UNKNOWN（浏览器用例在首个 `requestAnimationFrame` 内断言 `tabindex`）。
- Solid：与 Popover、Dropdown、Typography 组件的集成用例未移植。UNKNOWN（影响：Tooltip 与这些组件嵌套时的行为未经用例覆盖；解决条件：补 Solid 集成用例）。
- React、Vue、Solid：默认打开（如 `visible` 或 `defaultVisible`）的弹层不进服务端 HTML，触发器的 `aria-expanded`、`aria-controls`、`aria-describedby` 要到挂载后才与弹层一致。已知限制（升级条件：需要首帧即带这些属性时，按 props 在服务端推算）。
- React、Solid：竖向三角箭头的 svg 没有 `viewBox`（Vue 为 `0 0 7 24`）。UNKNOWN（影响：三个框架的箭头渲染可能不一致；解决条件：浏览器截图对比，不一致则补 `viewBox`）。
- React：Next App Router 的 Server Component 里 Tooltip 包着 Button 时，dev 下浏览器端收到的 Button 是 lazy 形态的 RSC 元素，`isValidElement()` 不认，`tooltip/index.tsx` 的 `wrapSpan` 在客户端多包了一层 `semi-tooltip-trigger-wrapper`，服务端没有，hydration 报 `Hydration failed because the server rendered HTML didn't match the client`。待处理（宿主夹具 `next-app` 的 `rsc/dev/rsc/console`，附录 A 的 next-app/N7；prod 同一页面通过，dev 下元素为什么以 lazy 形态到达浏览器 UNKNOWN，解决条件：在 dev 中打印该元素确认；修法是识别 lazy 元素或不依赖 `isValidElement()`）。

### Button、IconButton、ButtonGroup、SplitButtonGroup

- Vue：被 ButtonGroup 禁用的按钮外包 click 或 `contextMenu` 的 Tooltip 时打不开。待处理（`trigger.ts` 同时读 ButtonGroup 的 `disabled`，与 React 一致）。
- 保持原样：非元素的 `icon` 不渲染（Vue 渲染任意 `#icon` 插槽）。
- loading 的 Button 鼠标点击因 `pointer-events: none` 穿透到外层元素。待决（需删除该样式，有视觉变化）。

### Spin

- 保持原样：挂载时已在加载则立即显示，`delay` 不生效。

### Badge、Space、Skeleton

- Badge 的 `style` 落在计数 span 并替换 `countStyle`，`className` 落根元素。待处理（React 按 F2 把 `style` 落根元素，与 Vue 一致）。
- Badge 字符串计数在窄子元素上按字换行。待决（加 `white-space: nowrap` 后计数框可能超出子元素）。
- 保持原样：字符串 `count='5'` 不受 `overflowCount` 截断；Vue Skeleton `loading` 为 false 时 ref 的 `$el` 是 Fragment 锚点。

### Divider

- `cssClasses.PREFIX` 是 `semi` 而非 `semi-divider`，React 每处手拼 `-divider`。待处理（改 `PREFIX`，删手拼）。
- 保持原样：Vue render 期两次调用默认插槽。

### Empty

- 保持原样：Vue、Solid 每个实例各挂一个 MutationObserver。

### Timeline

- 保持原样：`extra` 为 0 渲染数字 0。

### BackTop

- 不做：`description`。
- 保持原样：改 `visibilityHeight` 后等下次滚动才判断；`prefers-reduced-motion` 下仍平滑滚动；Vue 开发期警告每次更新重复。

### FloatButton、FloatButtonGroup

- 保持原样：子项 key 用下标。

### Highlight

- 保持原样：Vue 数字样式不补 `px`。

### Descriptions

- 横向布局一行多组 th/td 且无 `scope`、`headers` 关联。UNKNOWN（读屏可能读不出键值对应；实机核实后用 `useId` 加 `headers`）。

### Progress

- `format` 返回过长文字时线形进度条文字被挤压按字换行。待决（加 `flex-shrink: 0; white-space: nowrap` 后进度轨变短）。

### Layout、Header、Footer、Content、Sider

- 保持原样：Sider `breakpoint` 只挂载时读取；`hasSider={false}` 去不掉 has-sider class；根元素为 `section`；React、Vue：深层 Sider 在 SSR 首帧缺 `has-sider`；Vue 渲染期读默认插槽最多执行两次。

### Grid（Row、Col）

- 保持原样：float 与 clearfix 样式生成 70 KB CSS。
- 文档 React Col 表的 `offset`、`pull`、`push` 写「左侧」「向左」「向右」，实现为逻辑属性。待处理（改为起始侧、末尾侧）。

### Collapsible

- 保持原样：收起态预览区不设 `inert`。

### CodeHighlight

- 保持原样：加载失败的 rejection 未处理。
- 保持原样：shiki github-light 的 `#E36209` 对比度 3.48:1；语法配色来自 Shiki 主题，check-pages 不计入 `.shiki` 内的 color-contrast。

### MarkdownRender

- Solid：按顶层块复用 DOM，流式输出时正在变化的整段或整个列表连同其中的图片、CodeHighlight 一起重建。已知限制（升级条件：需要元素级复用时，按 key 递归复用子节点）。
- Solid：mdx 格式与使用异步插件的 md 格式，服务端 HTML 与客户端首帧没有正文，挂载后编译完成才出现。已知限制（升级条件：服务端渲染能等待异步编译时，在服务端完成编译）。

### List、List.Item

- 保持原样：有 dataSource 无 renderItem 时不渲染也无空状态；grid 模式 li 无 ul 父元素；Item 的 `onContextMenu` 被覆盖；`grid` 的 className、style、ref 传给每个 Col。
- Solid：List.Item 在可点击与不可点击之间切换时重建 children，其中的状态丢失。已知限制（升级条件：需要保留状态时改为在 effect 中搬动同一批节点）。

### Lottie

- 保持原样：`params` 显式传 `container: undefined` 覆盖包裹节点。

### HotKeys

- 保持原样：根 div 带 `onClick` 无 role 与键盘处理；Vue 默认插槽可能执行两次。
- Solid：`render` 返回 `undefined` 与不传 `render` 无法区分，都显示默认按键内容。已知限制（升级条件：有实际需求时区分显式 `undefined`）。

### DragMove

- 保持原样：destroy 不还原 `cursor: move`；`allowMove` 只识别 input、textarea；无键盘移动方式。
- Solid：只绑定顶层 HTMLElement，SVG 根元素不可拖动（React 绑定所有宿主元素）。已知限制（升级条件：foundation 与 props 类型放宽到 Element）。
- Solid：内联尺寸与定位要测量后才写入，服务端 HTML 不含。已知限制（升级条件：需要首帧即正确时，按 props 推算）。

### Collapse、Collapse.Panel

- 保持原样：Panel 脱离 Collapse 抛错；溢出滚动的内容区不可聚焦；Vue `everOpened` 在渲染期写入。
- 面板较窄时 `extra` 与标题一起收缩，中文按字换行。待决（给 `.semi-collapse-header-right` 加 `flex-shrink: 0` 后标题更早截断）。
- Solid：`keepDOM` 加 `lazyRender` 下内容区消失后 `aria-controls` 的复位只在不再传 `children` 时生效，`children` 为 `null`、`false` 时仍视为有内容（已有 `it.fails` 用例）。已知限制（升级条件：Panel 改为按求值后的 children 判断有无内容）。

### PinCode

- 保持原样：输入框为空时 Backspace 仍调用 onChange；Backspace、Delete 无受控判断；`blur` 的 `handleCurrentActiveIndexChange` 不做事；其他 format 不限制字符；Form 注入的 `name` 被丢弃。
- 不做：点击空格子不重定向焦点。
- 输入法多字符 `data` 取最后一个字符。已知限制。

### Avatar、AvatarGroup

- 保持原样：topSlot、bottomSlot 只在 6 个预设尺寸渲染；`onError` 返回类型未写；`destroy()` 为空；AvatarGroup 包装元素内多个 Avatar 共用重叠序号。
- `bottomSlot` 方形标签比头像宽时按字换行。待决（加 `white-space: nowrap` 后标签超出头像两侧）。
- Solid：文字头像的缩放 `transform: scale(...)` 要测量后才确定，服务端 HTML 不含缩放。已知限制（升级条件：首帧文字溢出成为问题时，改为按字数推算初值）。
- Solid：AvatarGroup 在首帧与服务端还不知道子节点的位置，按 Avatar 的创建顺序计数 `maxCount`，挂载后才按子节点位置计数：子节点之间夹有文字或包装元素（`<Tooltip><Avatar /></Tooltip>`、`<div>`）时，首帧可能隐藏包装元素里的头像，包装元素收到 token 后显示为空（在数组中显示为「[object Object]」），挂载后恢复；超出 `maxCount` 的包装元素整体交给 `renderMore`，默认 `+N` 的名称不含其中头像的 `alt`；新增的头像在列表协调前先创建，协调后超出 `maxCount` 的再释放。已知限制（升级条件：包装元素里的头像需要在服务端正确渲染时，让包装元素也向组登记）。
- Solid：默认 `+N` 头像的名称只列被隐藏头像的 `alt`，因为隐藏头像不创建，读取子节点会创建它们。保持原样（需要名称时给头像传 `alt`）。
- Solid、Vue：图片在 hydration 前已加载失败时，Avatar 只靠 `onError` 切换，hydration 后不显示回退态（Solid 实测；Vue 依源码，UNKNOWN）。待处理（同 React 的 `_base/use-replay-image-events.ts`，hydration 时按 `img.complete` 与 `naturalWidth` 补发事件）。

### Breadcrumb、Breadcrumb.Item

- 保持原样：`moreType="popover"` 时点击 Popover 内链接冒泡并展开所有项。
- DOM 是 `nav` 内平铺 span，不是 APG 的 `nav > ol > li`，读屏不报项数。待处理（Item 改 `li`、外层 `ol`）。
- Typography 在 `ellipsis` 下把 Vue 插槽中的原生元素压成纯文本。UNKNOWN（是否与 React 一致未对照；对照后决定是否修 Vue Typography）。
- Solid：children 写法中落在折叠区间的非 `Breadcrumb.Item` 子元素在解析 children 时已创建，折叠时不插入，hydration 是否错位未核实；`renderMore` 收到的是 `{ children: 该元素 }`。UNKNOWN（影响：服务端渲染的折叠面包屑含原生子元素时可能错位；解决条件：补一条 hydration 用例，错位时改为在 Breadcrumb 外过滤这类子元素或要求写成 `Breadcrumb.Item`）。

### JsonViewer

- 保持原样：`options` 含内联 `customRenderRule` 时每次父级渲染都重建编辑器。
- Solid：`getSearchResults` 的返回类型写作 `ReturnType<JsonViewerFoundation['getSearchResults']>`，API 表显示内部类型。待处理（foundation 导出搜索结果类型后改用它）。
- 浏览器用例「编辑」在覆盖率与站点扫描同跑时偶发 15s 超时。待处理。
- `staticCompletions` 条件疑似写反。待处理（确认原意后修内核）。
- 内核 `#hiddenRangeModel` 在 worker 首次回复前编辑抛 TypeError，`#selectedIndex` 不复位导致建议变少时 `complete()` 抛错。待处理。
- 替换框与「替换」按钮可访问名称相同。待处理（需新增语言包键）。
- 搜索与替换把焦点交给内容区，组件层用 `keepFocus` 还焦点。待处理（改内核后删除 `keepFocus`）。
- Solid：编辑器在 `onMount` 中创建，服务端 HTML 与 hydration 前只有空的内容容器，挂载后才插入行号与内容区；搜索按钮的拖动层也在挂载后才写入 `cursor`、`touch-action`。hydration 用例只校验无报错，不比较挂载前后的结构。已知限制（升级条件：需要无 JS 或首帧可读时，服务端按 `value` 输出只读的格式化文本，并让用例的 `mountDiff` 收窄为属性列表）。

### Carousel

- 保持原样：`autoPlay`、interval 变化等下次切换；不经 onChange 改 `activeIndex` 无动画；`arrowProps.*.props` 替换内置 `onClick`；`defaultActiveIndex` 未使用；`goTo` 不重置计时。
- Solid：幻灯片自己的响应式 `class` 更新时整体改写 `className`，去掉 Carousel 加的 `semi-carousel-content-item` 等 class 且不会补回。已知限制（幻灯片切换 class 改用 `classList`；有实际需求时用 MutationObserver 跟踪）。
- Solid：服务端 HTML 中的幻灯片是使用方原样的标记，Carousel 加的 class、`style`、`id`、`role`、`aria-labelledby`、`inert` 在 hydration 时才写入，hydration 前所有幻灯片按普通块依次排列。已知限制（升级条件：需要首帧即正确时，由 Carousel 自己的包装元素承载这些装饰，或在服务端改写幻灯片标记的根标签）。

### Cropper

- 私有 `#imgData` 与 `state.imgData` 同名不同义，`ImageData` 遮蔽 DOM 全局类型。待处理（仅改名）。
- 保持原样：切换 src 后 zoom、rotate 不重置。
- Solid：内联尺寸与定位要测量后才写入，服务端 HTML 不含。已知限制（升级条件：需要首帧即正确时，按 props 推算）。
- React：UNKNOWN：服务端渲染的图片在 hydration 前已加载完成时，`onLoad` 不触发，裁切框的初始布局是否建立未验证（影响：裁切框可能不出现）。解决条件：在 `react-browser` 中用已缓存的图片做 hydration 用例，失败时接入 Image 使用的 `_base/use-replay-image-events.ts`。
- Solid：图片在 hydration 前已加载完成时 `onLoad` 不触发，裁切框可能不初始化（依源码）。待处理（同 Avatar 的补发事件）。

### Pagination

- `AdapterPageList` 沿用旧名，`updatePage(targetPageIndex = 1)` 缺省静默回第 1 页。待处理。
- React：defaultProps 的 `pageSize` 为 `null`（类型为 `number`），API 表默认值列因此显示 `null`，未传时实际取 `pageSizeOpts` 第一项。待处理（从 defaultProps 去掉 `pageSize`）。
- 保持原样：受控页码超过总页数时列表为空；total、pageSize 变化回第 1 页；warning 拼写 "ths"；small 模式 `total` 为 0 显示「1/0」。

### Steps

- 保持原样：Step 在 Steps 外使用抛错；basicSteps 单独使用产生空后缀类名；React、Solid 的 Step 在展开属性之后设置 `tabIndex`，传入的值被可点击状态覆盖（Vue 未核对）。
- 可点击 Step 的 `role="button"` 包住内容，构成嵌套交互元素。待决（读屏行为不确定；是否改为非嵌套结构）。

### Radio、RadioGroup

- 保持原样：onChange 事件对象无 `nativeEvent`；受控 `checked` 为非布尔值被忽略。
- Radio 的 `name` 优先于组名（Checkbox 相反），组内设不同 `name` 会脱离方向键导航。待决（统一用组名，或文档说明）。
- Vue：RadioGroup 非泛型，`strictVModel` 下字面量联合的 ref 做 `v-model` 会报错。待决（改泛型属公开 API 变更）。
- Solid：不在 RadioGroup 中的同名受控 Radio，选中其中一个后其余几个的原生选中状态不回写（React、Vue 相近）。已知限制（升级条件：出现脱离 RadioGroup 使用同名受控 Radio 的需求时，按 name 在文档范围内登记同步）。

### Checkbox、CheckboxGroup

- 保持原样：`handleChange` 有死代码；Form 重置时输出 "value should be an Array" 警告；`onChange` 的 `target` 是全部 props 展开。

### Anchor、Anchor.Link

- 保持原样：只滚动最近的可纵向滚动容器；原生平滑滚动卸载时无法取消。
- Link 靠元素树遍历确定层级，`defaultAnchor` 指向 autoCollapse 折叠子项时展不开。待决（是否改为 Link 经 context 注册，Vue 一并设计）。
- `autoCollapse` 下滚动进入未展开的折叠分支时，高亮不落到子项。UNKNOWN（未复现；补浏览器用例）。
- React：被 Activity 隐藏再显示时 `init` 重放 `defaultAnchor`，把用户位置拉回。UNKNOWN（推断自代码；补 Activity 用例）。

### ScrollList、ScrollItem

- wheel 受控键盘选择偶发多通知一次 `6`（序列 `6, 5, 6`）。UNKNOWN（来源未定位；在真实浏览器观察）。
- 保持原样：首项 offsetTop 为 0 被当作未知；`scrollToIndex` 的 `selectedIndex` 参数不被使用。
- cycled 模式在 React 之外 `prepend`、`append` 重排 `<li>`。待决（改为渲染期由 state 决定顺序）。
- wheel 模式高亮类由 foundation 直写 `classList`，重写 className 的渲染会抹掉它。待决（随 cycled 重排一起改）。
- `ScrollItemProps.transform` 的 `value` 为 any（改为 `T['value']`）；Vue ScrollItem 的 `defineExpose` 成员提取不到，Methods 表手写。待处理。
- Solid：cycled 模式下 foundation 在渲染之外移动 `<li>`，选项按字符串 key 渲染以保住被缓存的选中节点；移动之后列表长度再变化时，数组对账可能错位。已知限制（升级条件：随 cycled 重排改为渲染期决定顺序一起改）。

### OverflowList

- 保持原样：切换 renderMode 不重置派生的 visible。
- React、Solid：测量完成前根元素带 `visibility: hidden`，服务端 HTML 与 hydration 前整个列表不可见，由 ResizeObserver 测量后显示。已知限制（升级条件：需要无 JS 或 hydration 前可见时，首帧改为全部渲染再由测量收起）。

### Resizable、ResizeGroup、ResizeItem、ResizeHandler

- 保持原样：React Handler 的 `direction`、`onResizeStart`、`disabled` 声明但不生效（Vue、Solid 不提供）；受控 size 拖动时显示落后一次 mousemove（React、Vue）；动态增删子项不重新分配比例；ResizeGroup 直写子项 `style.width/height`。
- 带内边距的项在真实浏览器中的拖动最小值只有 jsdom 用例覆盖。UNKNOWN（补浏览器用例）。
- 分组不卸载、只移除正在拖动的 ResizeHandler 时，结束事件被忽略，透明背景层一直挡住页面（React、Solid）。UNKNOWN（影响：拖动中动态移除手柄；解决条件：确认节点移除后 `lostpointercapture` 的派发目标）。
- Solid：分隔条的 `aria-valuemin`、`aria-valuemax`、`aria-valuenow` 与各项尺寸依赖布局，挂载后才写入，服务端 HTML 中分隔条可聚焦但没有这些值。Vue：ResizeGroup 的项尺寸（`width: calc(...)`）与分隔条的 `aria-valuenow`、`aria-controls` 同样挂载后才写入。已知限制（升级条件：需要首帧即正确时，按 props 推算初值）。

### Portal

- 保持原样：`didUpdate` 在仓库内无使用方。

### CSSAnimation

- 保持原样：animationend 每次触发都重复调用 `onAnimationEnd(false)`；`stoppedByAnother` 含义失真；`onAnimationStart` 调用两次；SubNav、Table 展开图标的 `isAnimating` 恒为 true。
- React：Modal、SideSheet、Tabs 在 `animation: none` 页面上离场只靠 animationend，永不卸载。待处理（传入 `getElement` 并补浏览器用例）。Solid 的 `useCSSAnimation` 在没有运行中的动画时立即结束，不受影响。

### ConfigProvider、LocaleProvider、LocaleConsumer

- 保持原样：`ContextValue.children` 从未赋值；LocaleConsumer 无 `children` 时抛错。
- uz 语言包 `annotationTitle: "Manba ma'lumoti"` 的 `ma'lumot` 用 ASCII 撇号，是否改专用字符未定。待母语者复核。
- 不做：`screens` 跨断点让所有读 ConfigContext 的组件重渲染（实测低于 16ms；超过时拆独立 context）。

### ResizeObserver

- 保持原样：`delayTick` 从未读取；observeParent 只观察 HTMLElement 父元素。
- 子节点增删后由 React 对 observer 调 observe、unobserve，文档未承诺。待决（有用例锁定；是否写进承诺）。
- Solid：`observeParent` 取子元素挂载后的父元素，之后子元素被搬到别的父元素时不更新。已知限制（升级条件：有实际需求时在 effect 里订阅父节点变化）。

### Popover、Popconfirm、Trigger

- 保持原样：Popconfirm 的 `onConfirm`、`onCancel` 实际收到 `e.nativeEvent`。
- React、Vue：Popover 箭头的 svg 缺 `aria-hidden="true"`（Solid 与三个框架的 Tooltip 箭头都有）。待处理（补上，装饰性箭头不进可访问树）。
- React Tooltip、Popover 无 `aria-describedby` 通道，Popconfirm 直接改弹层元素。待决（加公开 `ariaDescribedby` 属公开 API 变化，Vue 已有）。
- Solid：与 Input（经 InputHandle 设置初始焦点）的集成用例未移植。UNKNOWN（影响：Popover 初始焦点交给 Input 的路径未经用例覆盖；解决条件：补 Solid 集成用例）。
- Solid：Popconfirm 卡片的 click 用 `stopImmediatePropagation` 对 document 监听隐藏，同一次点击不再到达 Tooltip 容器与外层的委托处理函数（`clickToHide` 在卡片内不生效）。已知限制（升级条件：出现需要 `clickToHide` 的 Popconfirm 用法，或 Tooltip 提供卡片内点击的统一出口）。

### Dropdown、Dropdown.Menu、Dropdown.Item、Dropdown.Title、Dropdown.Divider

- 保持原样：Item 自己的 `showTick` 不生效；Vue Item 的 `@click.once`、`@click.capture` 不走顶层分流；Vue 挂起的打开请求期间设 `visible` 为 true 不触发 `visibleChange`；DropdownDivider 不读 `overrideDefaultProps`。
- React：`DropdownProps` 继承 Tooltip 的 `disableArrowKeyDown`，但 Dropdown 总是向 Tooltip 传 true，调用方的值不生效（Vue、Solid 已从类型中去掉）。待处理（`DropdownProps` 改为 `Omit<TooltipProps, 'disableArrowKeyDown'>`）。
- React、Solid：浏览器用例「悬停子菜单被 … 关闭后，父项上按 ArrowRight 再次打开」在三个框架的浏览器全量测试同跑时偶发失败：子菜单已打开（父项 `aria-expanded="true"`），但首项没在 `waitFor` 时限内获得焦点；单独重跑通过。待处理（根因 UNKNOWN，先确认打开后聚焦首项依赖的时序）。

### ColorPicker

- 保持原样：AlphaSlider 忽略 `className`；两个 SliderWrapper 无样式；`isHandleGrabbing` 不参与渲染；`@ts-ignore` 访问 `EyeDropper`；`children` 只在 `usePopover` 时生效；`width`、`height` 为 null 回退 280。
- 语言包键 `ColorPicker.hue`、`saturation`、`brightness` 的 55 个非 zh_CN、en_US 译文为机译。待母语者复核（ceb_PH、fil_PH 沿用英文，ur 的 saturation 为音译；hue 重点 bn_IN、fa_IR、km_KH、my_MM、sw、uz、is、ga、ur）。
- 语言包键 `Upload.cropTitle` 的 54 个非 zh_CN、en_US、ja_JP 译文、th_TH 月名、kk `Form.optional`、nl_NL `Transfer.selected`、sq `Table.resetFilter`、ca 与 fa_IR 的占位符句子、nl_NL、pl_PL、sv_SE 的 AM、PM、year、month、day、sv_SE 与 fr_CA 的 `Calendar.AM`、`PM` 均为机译。待母语者复核。
- 语言包中 fi_FI、hi_IN、ro、sw、et、vi_VN、ms_MY、ko_KR 的同名文案、ru_RU `remaining`（「ещё N」），以及 `Sidebar.mcpServers`、`DatePicker.yearText` 的非 zh_CN、en_US 译文只按词义推断。待母语者复核。
- ColorChooseArea 经 `props.onChange` 与 `adapter.notifyChange` 回传，两种路径并存。待处理（改为直接调用父 foundation）。

### SideSheet

- 保持原样：Vue 遮罩离场比内容长时被截断。

### Notification、Notice

- 保持原样：直接渲染 `<Notice>` 不传 `type` 带 `-undefined` class；`useNotification` 不支持传 `id` 原地更新；根元素 `onClick` 无键盘方式。
- 浏览器用例「指针在列表上时暂停…」在 `test:coverage` 下偶发 hover 超时。待处理（等进场动画结束）。

### Slider

- 保持原样：`aria-required` 不输出；受控时每次变化都触发 `onAfterChange`；min、max 变化不重新 clamp；touchmove 是被动监听；外层 Tooltip 注入的鼠标事件被覆盖。
- 不做：Firefox、Safari 的方向键验证。
- keydown 被 `preventDefault` 后 keyup 仍调用 `onAfterChange`。待决（`handleKeyUp` 只在 keydown 未被拦截时结束变化）。
- React `SliderProps.onKeyDown` 继承 div 事件类型，实际绑定在手柄 input 上，与 F6 不一致。待决（改为 `KeyboardEventHandler<HTMLInputElement>`，属公开类型变化）。
- 刻度标签 `marks` 靠近末端或竖向时按字换行。待决（加 `white-space: nowrap` 后末端刻度超出轨道）。

### AudioPlayer、VideoPlayer

- 保持原样：语言包键 `locale.AudioPlayer.loop` 无使用方；文档 `playbackRateList` 说明与实际不符。
- `AudioPlayerState` 在 React、Solid 包中各声明一份；VideoProgress 手柄位置中的 `- 8px` 依赖样式里手柄宽度的一半。待处理（类型移入 foundation；手柄改用 `translate(-50%)` 定位）。

### Toast

- 保持原样：`close(id)`、`destroyAll` 不调用 `onClose`；`destroyAll` 无离场动画；`getPopupContainer` 返回 null 抛错；useToast 的 `defaultOpts` 忽略 `Toast.config()`；无 `type` 带 `-undefined` class；`getWrapperId()` 公开；Vue 多 app 共用只继承最后安装的上下文。
- 两个形状不同的 `ToastReactProps` 同名。待处理（`toast/toast.tsx` 的改名 `ToastItemProps`）。
- 静态选项类型不含 `dir`，`Toast.info({ dir })` 运行时可用但 TS 不接受。待处理（按 F6 并入根元素原生属性）。
- `useToast` 每次返回新对象，ChatBox 的 memo 失效。待处理（有实测收益再固定引用）。
- ToastList `onMouseLeave` 里高度守卫原因不明。UNKNOWN（查清后补注释或删除）。
- 进场动画未结束时关闭，Toast 直接消失无离场动画。待处理（先查 `_cssAnimation` 时序）。
- `ToastInstance.id` 可选却写进 `order: string[]`，`base/auto-close-foundation.ts` 同类。待处理（`id` 改必填或在 `add` 中断言）。
- 静态容器固定挂在 body，全屏期间 Toast 不可见（Notification 同）。待处理（add 时按 `fullscreenElement` 选挂载点）。
- React 静态方法与 hook 选项类型仍声明运行时会被覆盖的 `id`、`zIndex`、`getPopupContainer`、`close`、`ref`、`onAnimationEnd`、`onAnimationStart`（含 Notification）。待决（收紧属破坏性类型变更）。
- 播报区在真实读屏器中未验证（相同文本 1 秒内连播可能不播报），折叠堆叠下 Tab 聚焦展开只由单测间接覆盖。UNKNOWN（实机核对并补浏览器用例）。
- Vue：`rootAppContext()` 复制 config 的修复未在 runtime-only 开发构建实测。UNKNOWN（静态调用可能仍有 `[Vue warn]`；调用一次静态 Toast 确认）。
- Solid：`useToast`、`useNotification` 的 `contextHolder` 在调用 hook 时创建，只读调用处的 context，放置处外层的 Provider 不生效。已知限制（升级条件：需要按放置位置读 context 时，改为像 Vue 那样返回 Holder 组件）。
- Solid：指针或焦点在 hook 列表上时把 `contextHolder` 移出文档再放回，列表仍按悬停或聚焦暂停，直到指针再次进出（Notification 同）。UNKNOWN（由代码推断，未实测；升级条件：有低成本的 DOM 脱离信号后在脱离时清除暂停）。

### UserGuide

- `target` 解析为 null 的步骤静默不显示。待处理（开发环境告警）。
- 保持原样：Vue 受控 `current` 的 watch 为 `flush: 'post'`，一次 flush 渲染两次。
- Solid：目标自行移动或晚于显示挂载时，聚光区域要等下一次缩放或滚动才更新。已知限制（升级条件：有实际需求时对目标加 ResizeObserver）。

### Tabs、TabBar、TabPane、TabItem

- 保持原样：`handleArrowClick` 改写传入数组；非受控 key 回落 `panes[0]` 不跳过 disabled；TabPane 脱离 Tabs 或 `more` 非法值抛错。
- Vue：`tab-bar` 在 `onUpdated` 重测溢出，`collapsible="auto"` 可能折叠振荡。UNKNOWN（未复现；构造临界宽度用例）。
- Solid：TabPane 的内容按 Tabs 中的渲染位置查找 context，夹在 Tabs 与 TabPane 之间的 Provider 不生效；非 TabPane 的内容子节点读不到 TabsContext。保持原样（同 Solid 的 Switch、Match；升级条件：token 记下 `getOwner()`，父组件通过 `createRoot((dispose) => { onCleanup(dispose); ... }, owner)` 读取）。
- Solid：`tabBarExtraContent` 的 `float` 只在内容解析时从元素 `style` 读取一次。已知限制（升级条件：有需求时改为响应式读取）。
- Solid：数据 token 在收集方之外以数组插入时渲染为 "[object Object]"，收集方要自行滤掉 token。已知限制（彻底消除需改变 `createToken` 的返回值形态）。
- Solid：`collapsible="auto"` 记住的折叠宽度只在页签增删或换序时重置，标题变长或变短不重置。已知限制（升级条件：出现标题动态变化后需要重新展开的需求时，改为在 TabItem 尺寸变化时重测）。
- Solid：`collapsible` 的折叠要测量后才确定，服务端 HTML 中页签全部展开，挂载后再收进菜单。已知限制（升级条件：首屏布局移动成为问题时，按 props 推算首帧）。
- Solid：`more.render` 的返回值被 Dropdown 包在可聚焦的 span 触发器中，返回 Button 等可聚焦元素时出现嵌套的 Tab 停靠点并触发 Dropdown 告警（文档站 `more-advanced` demo 即此情形）。待决（方案：`more.render` 改为接收 `getTriggerProps`，由使用方展开到自己的触发元素上；属公开 API 变化）。

### Modal、ModalContent、ConfirmModal、useModal

- adapter 方法 `disabledBodyScroll`、`enabledBodyScroll` 读作状态，四处同名。待处理（改为 `lockBodyScroll`、`unlockBodyScroll`）。
- 保持原样：onOk、onCancel 返回被拒绝的 Promise 时 foundation 再次抛出；显示期间副作用绑在「打开到离场动画结束」上；React、Solid 组件版 Modal 的 Props 类型含 foundation 的 `content`（供命令式方法使用），组件版不渲染，API 表已注明。
- Vue Modal 动画时长为 0 时两帧内连续关、开、关会丢失第二次 after-leave，焦点陷阱与滚动锁不释放。待处理（默认主题不触发；检查残留 `_isLeaving`）。
- Vue：Modal 与 ImagePreview 用 `resolvePopupContainer(...) === document.body` 判断是否覆盖页面，React、Solid 用 `coversPage`；`getPopupContainer` 返回 `null` 时 Vue 在这一判断处就抛错（另两个框架在 Portal 处抛）。待处理（改用 `coversPage`）。
- `aria-modal` 对话框外 Portal 到 body 的下拉 listbox 是否被读屏视为不可达，未在 VoiceOver 与 NVDA 验证（含 SideSheet、Image 预览）。UNKNOWN（需实机核对）。

### Navigation（Nav、Item、Sub、Header、Footer）

- 保持原样：children 写法重渲染重建菜单；受控 `selectedKeys` 变化重置展开；受控 `openKeys` 不驱动水平或折叠弹层；禁用链接项仍跳转；内联 `items` 字面量。
- Vue：包装 Nav.Sub 的组件只作为一项收集，Nav 不调用其默认插槽，子项不参与默认选中项的祖先展开。已知限制（升级条件：改为像 rc-menu 那样在隐藏容器里渲染一遍子项来收集）。
- 包装 Nav.Item 的组件内部写死 `itemKey` 时 Nav 读不到。已知限制（顶层时嵌成 `li > li`）。
- RTL 下布局未做改动前后对比。UNKNOWN（补 RTL 布局快照比对）。
- 多个组件未声明 context 类型。待处理（全部声明后删 `HostContext` 的 any 分支）。
- context 字段仍是可选。不做（开启 `strictNullChecks` 后改必填）。
- Nav.Item、Nav.Sub 的 `indent` 类型为 `boolean | number`，实际只按真假判断。待决（类型改为 `boolean` 属公开类型收紧）。
- React：Nav 的 `multiple`、`onDeselect` 与 Nav.Sub 的 `isCollapsed`、`isOpen`、`maxHeight` 声明但不生效，API 表已注明。待决（从公开类型删除属公开 API 变化）。
- React：折叠或水平弹层里的嵌套 Sub，外层 li（Dropdown.Item）和标题都是 `menuitem`，两层嵌套；Nav.Sub 丢弃使用方的 `className`。待处理（外层 li 改为 `role="none"`、`className` 落到外层 li，同 Solid；Vue 未核对）。
- Solid：用 `items` 渲染时，新的 `items` 数组重建所有行，持有焦点的行失焦（React 按 key 保留）。已知限制（升级条件：按 itemKey 复用 Nav.Item 与 Nav.Sub 的 token）。
- Solid：图标尺寸适配（`_base/icon-slot.ts`）无法区分写成 `size="default"` 与未写尺寸的图标，Breadcrumb、Toast、Notification、确认框同样受限。已知限制（升级条件：图标组件提供显式的尺寸标记）。在插槽之外创建的图标元素（数据对象里的 JSX，如 `Modal.confirm({ icon })`）拿不到插槽的类名与尺寸类，这些类在 effect 里加上，服务端 HTML 不带，hydration 后才出现。已知限制（升级条件：这类入口改为渲染函数，在插槽内创建）。
- Solid：Nav.Sub 里 Nav.Item、Nav.Sub 以外的内容在 Nav 祖先的 context 下创建，放进 Dropdown 弹层后读不到该 Dropdown 的 context。已知限制（升级条件：改为在 Sub 视图里解析内容，itemKey 另做一次解析来收集）。

### Typography（Text、Title、Paragraph、Numeral、Copyable）

- Numeral 的 `ellipsis` 文档有、类型无、运行时生效。待处理（删文档行或补回类型，由维护者决定）。
- 复制成功后读屏播报因读屏而异；文档站重载后偶发省略测量偏差；不可收起的展开按钮激活后焦点环未确认。UNKNOWN（分别需实机读屏、冷启动 Chrome、目视检查 `:focus-visible`）。
- 省略加 `showTooltip` 且含复制按钮时描述挂载位置未定；只设 `expandText` 不设 `expandable`（`collapseText` 同）时按钮无效果。待决。
- Vue：`showTooltip.type` 区分大小写，写成 `'Popover'` 时渲染 Tooltip（React、Solid 不区分）；展开、收起后的焦点转移三个框架不一致（React、Solid 在可展开且无 `collapseText` 时同步聚焦根节点，Vue 只在按钮仍持有焦点时于 nextTick 后聚焦）。待处理（判断移入 foundation 统一）。
- Solid：`ellipsis` 截断后插入的是字符串 `ellipsisContent`，children 的解析结果仍被创建而不插入（截断只在客户端发生，不影响 hydration）。已知限制（升级条件：截断文本改为从非 JSX 来源派生时，只在未截断分支里解析 children）。
- 保持原样：Solid 的 `link`、`delete`、`strong`、`underline`、`code`、`mark` 与 `ellipsis` 的有无在运行时变化时增删包裹元素，children 重新创建（子组件状态丢失），与 React 换包裹元素时子树重新挂载一致；省略、展开、收起不变更包裹层，不受影响。
- 保持原样：Numeral `bytes-*` 浮点误差；Vue Numeral 整段格式化。

### Input、TextArea、InputGroup

- Input 在输入法组合中失焦是否需像 TextArea 按 `maxLength` 截断未验证；Vue TextArea 同设 `maxlength` 与 `composition` 时受控或 `v-model.lazy` 下失焦截断可能与显示文字不一致。UNKNOWN（需真实输入法复现、补用例）。
- 保持原样：InputGroup 下发属性落 DOM；未声明属性落在原生 input；内部 Input 的全局默认值按 F7 由宿主显式挡掉；TextArea 清除按钮在 `click` 清除。
- Solid：在图标槽位（Input、Select 等的 `prefix`、`suffix`，Toast、Notification、Modal.confirm 的 `icon`）之外预先创建的图标元素读不到槽位 context，服务端 HTML 不带槽位的尺寸与类名，挂载后才补上。已知限制（升级条件：首帧图标尺寸跳变成为问题时，数据对象的 `icon` 改为接受图标组件）。

### Image、ImagePreview 及预览子组件

- `viewerVisible`、`isValidTarget` 命名不符。待处理（改为 `controlsVisible`、`isOutsideControls`）。
- RTL 下 prev/next 按钮竖向居中未目视核对。UNKNOWN。
- Solid：预览组收集各 Image 的 `title` 放进 context（`titles: JSX.Element[]`），收集时是否创建节点、节点是否只在预览打开时插入未核对。UNKNOWN（影响：Image 的 `title` 为 JSX 时可能 hydration 错位；核对方式：补一条 SSR 计数用例）。
- 保持原样：点击缩略图打开预览触发 `onChange`；`preview.defaultVisible` 不支持。
- Solid：Image 的预览入口（`role="button"`、`tabindex="0"`、`aria-haspopup`）挂载后才写入，服务端 HTML 与 hydration 前图片不可操作。已知限制（升级条件：需要首帧即可操作时，按 `preview` 与加载状态在渲染期推算）。
- Solid：图片在 hydration 前已加载完成或失败时，`onLoad`、`onError` 不触发，hydration 后停在加载态（依源码）。待处理（同 Avatar 的补发事件）；修复后 Solid `ssr-cases.tsx` 的 image 用例要按加载后的状态比较。

### Feedback

- bottom 动画 keyframes 改名后视觉未核对。UNKNOWN（目视检查 Feedback 与 bottom SideSheet）。
- radio、checkbox 选项组无默认可访问名称。已知限制（用 `radioGroupProps`、`checkboxGroupProps` 的 `aria-label`）。
- popup 模式默认不响应 Esc：Feedback 不向 SideSheet 传 `closeOnEsc`，SideSheet 默认为 false，与 Accessibility 一节「按 Esc 触发取消」不符。待决（默认开启 `closeOnEsc`，或改文档）。
- React：`radioGroupProps`、`checkboxGroupProps`、`textAreaProps` 展开在 Feedback 传入的受控 `value` 之后，其中的 `value` 会盖掉 Feedback 的值，选中状态与 `onValueChange` 不同步。待处理（展开前去掉 `value`，或在类型中 Omit；其他框架未核对）。
- 保持原样：popup 的 onOk、onCancel 返回被拒绝 Promise 时再抛。

### TagInput

- React 外部点击未接入 `useClickOutside`，`suffix` 内 Popover 等按下会结束激活（Vue 不会）。待处理。
- 公开事件别名 `TagInputCursorEvent` 等为 `any`。待处理（需维护者决定）。
- 保持原样：`setFocusing` 与 `toggleFocusing` 职责重叠；React、Solid 的 `restTagsPopoverProps.content` 替换 +N 浮层里的剩余标签（Vue 的 Popover 没有 `content` 属性）。
- `maxTagCount` 折叠时在 `+N` 浮层中点击标签：焦点进入浮层会激活 TagInput 并展开全部标签，浮层随之消失，这次点击关不掉那个标签（React、Solid 相同）。待处理。
- Solid：上一次放下的动画未结束时立即开始键盘拖拽，方向键不移动项。UNKNOWN（影响：连续快速键盘排序；解决条件：确认是否为 dnd-kit 行为，React、Vue 是否相同）。
- Solid：拖拽中途 Sortable 被卸载（受控 value 清空、`draggable` 变 false）时 `onDraggingChange(false)` 可能不触发，之后失焦不结束激活（React 相同）。UNKNOWN（解决条件：确认 dnd-kit 卸载时是否补发 dragend）。

### AutoComplete

- `#backwardLabelInValue` 名不副实，`#getRenderSelectedItem` 留空 `else if`；数据项带 `show: false` 时高亮与 Enter 选中项错位。待处理。
- 浏览器用例「下拉宽度不小于触发器宽度」连跑时偶发 109px。UNKNOWN（复现时记录弹层的 `--semi-tooltip-trigger-width` 与触发器宽度）。
- 只用 `<label for>` 命名时 listbox 无名称。已知限制（传 `aria-label` 或 `aria-labelledby`）。
- 对象数据项缺 `label` 时候选行为空（React、Solid；Vue 显示 `value`，各自文档与代码一致）。待决（三端统一）。
- 保持原样：`onChangeWithObject` 声明未读取；`loading` 时方向键、Enter 仍打开面板。
- Vue、Solid：`defaultOpen` 的 AutoComplete 挂载后才打开，服务端 HTML 中触发器 `aria-expanded="false"`。已知限制（见 Select）。

### Table

- 展开行 key 两种拼法。待处理（统一由 `genExpandedRowKey` 生成，后缀取 `-expanded-row`）。
- `TableSelectionCell`、`TablePaginationProps`、`ResizeFn` 命名不一或重名；`OnFilter` 首参名 `filteredValue`。待处理（统一命名）。
- React：`useFullRender` 且列 `title` 为函数时排序按钮无可访问名称。待处理。
- Vue：`resizable` 的 `onResizeStart` 返回 `class` 且无 `onResizeStop` 时 `handlerClassName` 留在列上。待处理。
- `init` 与 `#handleDataUpdate` 重复重算序列；默认键仍在 `init` 解析。待处理（合并到 `#applyQueries`，默认键移入静态 `getInitialState`）。
- Vue：`virtualized` 的表体在首帧只用列声明的数值 `width` 排布；有列未声明数值宽度时服务端 HTML 与 hydration 首帧没有表体行，挂载测量后才渲染。已知限制（升级条件：foundation 的 `getCellWidths` 能由列声明推出宽度）。
- 示例里 `title: ''` 的操作列无可访问名称；Vue `column-selection.vue` 的 `originNode` 用 `h` 拼成，不进 block tree。待决。
- header-style 示例无 `scroll.y` 仍报 `scrollable-region-focusable`。UNKNOWN（定位滚动容器）。
- 固定表头或虚拟化时可聚焦滚动容器位于 `role="table"` 内，axe 报 `aria-required-children`。已知限制（示例留基线）。
- Solid：`expandIcon` 的 `semi-table-expandedIcon-show`、`-hide` 类在 effect 里按展开状态加到使用方的节点上（元素与函数形式都是），服务端 HTML 不带，hydration 后才出现。已知限制（升级条件：函数形式的参数增加 `class`，由使用方写到自己的元素上，并取消对使用方节点的就地改写）。
- Vue、Solid：`--semi-table-section-width` 要测量后才写入，服务端 HTML 中表格区段宽度未定。已知限制（升级条件：首屏布局移动成为问题时，按列宽推算初值）。
- 未设 `ellipsis`、`fixed`、固定表头时表格为 `table-layout: auto`，各列数值 `width` 之和超过容器时，Chrome、Firefox 加宽表格并横向滚动，WebKit 把表格限在容器宽度并按比例压缩各列（1000px 容器中 364、400、100、100 渲染为 343、378、99、99），`resizable` 拖到的宽度随之不准。待决（影响：Safari 中列宽小于声明值，拖动时手柄落后于指针；解决条件：决定是否在列宽之和超出时改用 `fixed` 布局或给表格写 `min-width`）。
- 不做：列宽拖动手柄的键盘操作（APG 无对应模式；升级条件：出现需求时按 Resizable 的 separator 模式实现）。
- 保持原样：根类名 `semi-table-wrapper-undefined`；非受控只改 pageSize 不切页；只应用第一个排序器；受控 currentPage 不调用 onChange；RTL 虚拟化与表头阴影；`OnHeaderCell<R>` 使 `ColumnProps` 对 R 不变；`rowSelection.disabled` 阻止 `clickRow`；`handlerClassName` 默认 `'resizing'`。

### Tree、TreeNode、NodeList、AutoSizer

- tree 与 tree-select foundation 仍各写一份成段逻辑；非受控 `defaultValue` 在 `treeData` 稍后到达时丢失（沿用 TreeSelect 的 `keepUncontrolledKeys`）；Vue drop 节流用例的 spy 不生效。待处理。
- 拖拽向 body 追加透明元素；Vue `prevProps` 存放在 foundation state。待决。
- 键盘模型用 `aria-activedescendant` 而非 roving tabindex。UNKNOWN（VoiceOver、NVDA 实机验证）。
- 保持原样：动画中 treeData 变化 NodeList 停在旧节点；Tree 不支持 children 写法；行内按钮 click 冒泡触发 `onSelect`；Enter、Space 不随 `expandAction` 展开。
- Solid：Tooltip 包 Tree 只能用元素 children，外面多一层 `tabindex="-1"` 的 span，`aria-describedby` 不落在 `role="tree"` 上；函数 children 的元素 `ref` 与 Tree 交出 `TreeHandle` 的 `ref` 冲突。已知限制（升级条件：有需求时给 Tree 加元素 ref prop）。
- Solid：`expandIcon` 为元素时，`semi-tree-option-expand-icon` 类与展开点击监听在 effect 里加到使用方的元素上，服务端 HTML 不带该类，hydration 后才出现；函数形式创建时就收到 `class`，不受影响。已知限制（升级条件：取消元素形式，只保留函数形式）。

### Cascader、Cascader Item

- 每个选项 Item 收到内联回调，悬停或展开时整列重渲染。待处理。
- 受控单选 `filterLeafOnly=false` 搜索选中分支后受控与非受控显示不一致。待决。
- 保持原样：不用 `aria-owns`；Tab 离开不触发 `onBlur`；Esc 关闭触发 `onBlur`；点击标签后移除焦点落 body；多选搜索无当前项时 Enter 仍建新标签；受控 `value` 中不在 `treeData` 的路径无占位标签。
- `highlightParts`、`getColumns` 在 React 内联、Vue `cascader/utils.ts`、Solid `cascader/item.tsx` 各有一份。待处理（下沉到 semi-foundation/cascader）。

### TimePicker、TimeInput、Combobox

- `combox-foundation.ts` 文件名拼错且只有静态函数；Vue `setTriggerFocus` 用 `as HTMLElement` 去 null。待处理（改为模块级函数，改名 `combobox-options.ts`）。
- 保持原样：设 timeZone 时 `onChange` 按宿主时区格式化；`invalid` 恒 false；`onBlur` 只在点击外部关闭时触发。
- 用自定义触发器时未声明的属性（`id`、`aria-*`、`data-*`、原生事件）不落到任何元素（React、Solid；Vue 落在根元素）。待决（统一落点）。
- `disabledTime` 与 `triggerRender` 的 `value` 声明为 `Date[]`，未选的一侧实际为 `undefined`（foundation、React、Solid；Vue 已声明为 `(Date | undefined)[]`）。待处理（改类型，属公开类型）。
- Solid：自定义触发器内有没有可聚焦元素，只在触发器挂载时测量一次，之后内容增删可聚焦元素，包裹 div 的 button 语义不跟着切换。已知限制（升级条件：需要动态切换时，用 MutationObserver 监听触发器子树后重新测量）。

### Select、Option、OptGroup

- 多选下拉关闭时焦点在触发器与 +N 浮层间移动多出一对 `onBlur`、`onFocus`；复合组件内部 TagInput、Select 吃到全局默认值（按 F7 由宿主显式传值）；`allowCreate` 宽度受限时「创建」提示按字换行。待处理。
- `filter` 加 `searchPosition="trigger"` 的单选关闭时字符、Space、Home、End 无反应；`renderSelectedItem` 类型不随 `multiple` 收窄。待决。
- React：`filter` 函数类型的参数名拼写为 `inpueValue`，出现在 API 表的类型列。待处理（改为 `inputValue`）。
- `allowCreate` 不支持异步创建；读屏虚拟光标激活触发器内控件不开合弹层；`virtualize` 时回落的高亮可能在渲染窗口外。已知限制。
- 不做：未选值时 placeholder 成为 select-only combobox 的 AX value（2026-10-11，与 React Aria、Radix 一致）。
- 保持原样：多选标签传未声明 `disabled`；分组标题使 `:nth-child` 偏移；自定义创建项不可聚焦；重开下拉保留上次高亮；`prefix` 与 `insetLabelId` 同传时 prefix 不作名称来源。
- Solid：`OptionGroupProps` 用索引签名，没有原生属性的类型提示；`inputProps` 内含 JSX 时每次读取都新建节点。待处理。
- Vue、Solid：`defaultOpen` 的 Select 服务端 HTML 中触发器 `aria-expanded="false"`，挂载后才打开。已知限制（升级条件：弹层进入服务端 HTML 时一并处理，TreeSelect、AutoComplete 相同）。

### TreeSelect

- `expandAction` 为 click 加 `loadData` 时点击 `isLeaf` 叶子仍调用 `loadData`（加 `isTreeNodeLeaf` 判断）；搜索中 `treeData` 只换引用时收起的祖先被重新展开（传 `prevState.filteredKeys`）。待处理。
- 下拉打开时 Tab 离开触发 `onBlur` 但下拉保持打开；Vue `prevProps` 存放在 foundation state（见 Tree）。待决。
- 保持原样：`isRenderInTag: false` 时无 key 告警；`#isLoadControlled` 把空数组视为非受控；点击标签后移除焦点落 body。
- Vue、Solid：`defaultOpen` 的 TreeSelect 挂载后才打开，服务端 HTML 中触发器 `aria-expanded="false"`。已知限制（见 Select）。
- `deriveState` 在 `treeData` 键集合变化、受控 `expandedKeys` 变化时按 `motion` 判断是否处理展开动画状态，但树的展开动画由 `motionExpand` 控制（三端共用 foundation）。待处理。

### DatePicker、DateInput、MonthsGrid、Month、Navigation、YearAndMonth、QuickControl

- month、monthRange 带 disabledDate 且当前月被禁用时 onChange 收到两次且第一次是禁用日期；`DatePickerFoundation.init` 仍解析初始值，靠 `#initialized` 只执行一次（移入静态 `getInitialState`）。待处理。
- 受控 `open` 改 false 关闭且 `insetInput` 时焦点归还未验证。UNKNOWN（补浏览器用例）。
- `InsetTimeInput` 的可访问名称无专用语言包键。UNKNOWN（确认是否需要，需要则按 locale-text 补齐 57 个语言包）。
- 保持原样：autoSwitchDate 对范围无效；`onFocus` 打开面板的页面键盘选择或 Esc 后会重新打开；左面板键盘移出本月时焦点不跨到右面板。

### Form、ArrayField、withField、Label、ErrorMessage、Section、Slot、InputGroup

- React `form/label.tsx` 不导入 `form.scss`；字段状态由 withField 多个 useState 与 foundation 两处保存（随 Form 重写）；`BaseFormApi.getTouched` 返回类型与 `setTouched` 不一致；每次 Form 更新重渲染全部字段。待处理。
- 错误叶子类型为 `string` 而多条失败时运行时为 `string[]`；Vue `FieldLabel` 无 `id`；React Form.Checkbox、Form.Radio 的 onChange 类型读不到 `latestValues`。待决（均属公开类型变化，需批准）。
- 字段无初值时 `onChange` 抛错后子组件仍显示被拒绝输入（需回滚设 `initValue`）；`reset(fields)` 作废进行中的校验时 submit 以未校验初值调用 `onSubmit`。已知限制。
- 保持原样：不改 ESM 命名空间（2026-10-09，摇树不生效）；挂载 Field 不触发 `onChange`；`CommonexcludeType` 命名。

### AIChatInput、Configure

- Solid：`renderActionArea` 的 `menuItem` 是组件体里创建好的上传、发送节点，使用方不插入时节点创建而不插入，服务端渲染后 hydration 错位。待处理（方案：同 `renderUploadButton` 的 `defaultNode`，改为 `(() => JSX.Element)[]`；粘贴上传依赖常驻的 Upload，需先把粘贴入口与按钮分开）。

- `LeftMenuChangeProps` 与 `Setup` 是同一类型的两个名字；编辑器 `injectCSS: false`，传入 Gapcursor、Dropcursor 时无样式。待处理。
- 浏览器用例「方向键移到长列表末项时面板滚动」在全量 coverage 中失败过一次。UNKNOWN（失败时记录面板 `clientHeight`、`scrollHeight`）。
- Chrome on macOS 从 Finder 复制文件后粘贴，剪贴板是否同时带文件名和文件未验证。UNKNOWN（影响：只插入文件名不上传，需维护者知情）。
- `sendHotKey` 为 `shift+enter` 时换行分支不看 `allowHotKeySend`；React `uploadProps` 类型仍接受 `fileList`、`listType`（Vue 已 Omit，属破坏性类型变化）。待决。
- 保持原样：inputSlot 空槽 placeholder 宽度晚一帧；Configure 的 `value`、`field` 只在挂载时读；`skillHotKey` 无默认值。
- foundation 的方向键与 Enter 分支不判断 `templateVisible`，而 `getListbox` 在 `templateVisible` 为真时返回 `undefined`。UNKNOWN（影响：`templateVisible` 与 `skillVisible` 同时为真时高亮仍移动，`aria-activedescendant` 却被撤掉；解决条件：核实两者能否同时为真，能则在这些分支先判断 `templateVisible`）。
- Solid：父组件在挂载期间（渲染中或 `onMount`）把 `generating` 设为 true 时不清空内容与附件（React 会清空），编辑器要到 RichTextInput 的 `onMount` 才创建。已知限制（升级条件：清空请求在编辑器就绪前排队，`onReady` 后执行）。
- Solid：编辑器在 RichTextInput 的 `onMount` 中创建，服务端 HTML 的 `semi-aiChatInput-editor-content` 是空容器，没有 ProseMirror 子树与 placeholder，挂载后才插入。hydration 用例只校验无报错，不比较挂载前后的结构。已知限制（升级条件：需要首帧显示 placeholder 时，服务端输出与编辑器结构一致的静态占位，并让用例的 `mountDiff` 收窄为属性列表）。

### Sidebar、Container、Annotation、MCPConfigure

- `MCPOption.icon`、`desc` 为 any。待处理（foundation 加 Option 泛型参数后再收窄）。
- 保持原样：无 `url` 的 Annotation 条目不可聚焦；文件编辑器 MenuBar 非 `role="toolbar"`；Sidebar 忽略 `containerRef`、`renderHeader`、`children`。
- Solid：父组件在 `onMount` 中切换 `mode` 时不移动焦点（React 在焦点位于 body 时移到返回按钮），首轮 effect 时新视图尚未渲染。已知限制（升级条件：需要挂载期切换也转移焦点时，把焦点修复移到视图更新之后）。

### AIChatDialogue、Dialogue、DialogueAction

- 两个流式适配器返回形状不一致；`URLCitation`、`ImageGenerationCall` 各有两份定义。待处理（统一并显式注解，合并或改名 `Wire*`）。
- 代码块子节点被 rehype 拆成元素时 React 无复制按钮，Vue 仍显示。待决（A 对齐 React，推荐；B 保留）。
- 消息列表 `role="log"` 带 `tabIndex=-1`，程序化聚焦可能显示焦点环。UNKNOWN（目视检查 `:focus-visible`）。
- 保持原样：onChatsChange 调两次；`resetMessage` 忽略传入 message；`continueSend` 写死 false；`hideMoreDropdown` 定时器卸载不清理；Action 的 className、role、messageEditRender 不消费；文件卡片引用图标冒泡。
- React 的带语言代码块把 `.semi-ai-chat-dialogue-code` 的 div 放在 markdown 的 `pre` 内（div 不是 `pre` 允许的内容），因为 `pre` 只认 MarkdownRender 自带的 `code`。待处理。

### Chat

- foundation 的 `onMessageSend`、`onHintClick`、`onInputChange` 与 props 回调同名。待处理（改为 `sendMessage`、`handleHintClick`、`handleInputChange`）。
- 保持原样：markdown 异步编译使跟随底部落后一块；定时器卸载不清理；`resetMessage` 在空列表造 loading 消息；`uploadProps.renderFileItem` 被丢弃。
- Solid：`uploadTipProps` 与自定义 `uploadProps.children` 同用时，Tooltip 用 span 包住自定义节点；节点内有可聚焦元素时 span 退出 Tab 顺序并给出 warning，`aria-describedby` 落不到该元素上（AIChatInput 相同）。已知限制（升级条件：Upload 的 `children` 接受 `(getTriggerProps) => JSX.Element` 后，把提示属性展开到自定义触发器上）。

### Calendar

- `Locale.Calendar.AM`、`PM` 与 `TimePicker.AM`、`PM` 同名异义。待处理（加 JSDoc）。
- 时间槽与日期格的点击没有键盘方式。保持原样（每格加 button 会多出 42 或 336 个 Tab 停靠点；升级条件：需要时视图改为 ARIA grid 加 `aria-activedescendant`，复用 DatePicker 的网格模式）。
- `dateGridRender` 的两个参数声明为可选，各视图总是传入。待处理（改为必填，属公开类型）。
- Solid：月视图首帧显示全部事件，测量行高后才折叠为「N 更多」，服务端 HTML 是未折叠的。已知限制（升级条件：行高可在服务端预知时，按行高推算初值）。
- Solid：周视图与日视图在挂载后才知道哪一列是今天，该列随之重建以启动当前时间线，hydration 后的 DOM 结构与服务端不同；今天标记（`aria-current`、`-today`）与时间线只在挂载后出现，是为了服务端与浏览器处于不同日期时不错位。已知限制（升级条件：需要首帧即带时间线时，服务端按请求时间输出且客户端读同一时间）。
- 保持原样：全天事件在 RTL 下不镜像。

### InputNumber

- 保持原样：数值为 0 时无 `aria-valuenow`；`pressInterval` 默认 250ms；小写 `autofocus` 落 DOM；挂载后 `localeCode`、`currency` 变化不重新格式化。

### Upload、FileCard

- `#handleProgress` 直接读 `e.total`，无参调用抛 TypeError（改为 `e?.total > 0`）；每个进度事件都让全部 FileCard 重渲染。待处理。
- Form.Upload 必填时无元素带 `aria-required`。待决（可并入添加按钮 `aria-describedby`）。
- FileCard 的 Props 经 `BaseFileItem` 带上内部标志 `_sizeInvalid`。待处理（从公开类型中去掉）。
- 添加区的 MutationObserver 的 `attributeFilter` 只含 `addAreaControlAttributes`，子元素在挂载后增删 `aria-label`、`aria-labelledby`、`alt` 时不重算是否已有名称，兜底的 `aria-label` 可能多出或缺失。待处理（`attributeFilter` 补上这三个属性）。
- Vue：添加区是否已含可聚焦控件要挂载后才判定，服务端 HTML 中触发区带 `role="button"`、`tabindex="0"` 并包着内部按钮（嵌套交互元素），挂载后才去掉。已知限制（升级条件：需要 hydration 前无嵌套交互元素时，首帧按 `children` 是否为元素判断）。
- Solid：只有 Semi 的 Button、IconButton 与 AIChatInput 的默认上传按钮在组件体内向添加区登记，首帧即判定；原生 `button`、`a[href]` 等其他可聚焦控件仍在挂载后由 MutationObserver 判定，服务端 HTML 中触发区同样带 `role="button"`、`tabindex="0"` 并包着该控件。已知限制（升级条件：需要其他 Semi 控件首帧即判定时，在其组件体内调用 `upload/context.ts` 的 `useAddAreaControl`）。
- 保持原样：部分示例 img 无 alt；`timeout`、`FileCardProps.className` 未使用。
- Solid、React、Vue：FileCard 的图片预览只靠 `onError` 切到回退图，图片在 hydration 前已加载失败时不显示回退图（Solid 实测；React、Vue 依源码，UNKNOWN）。待处理（同 Avatar 的补发事件）。

### Transfer

- foundation 类型不完整，`PaginationProps` 与 Pagination 同名异义，`HeaderConfig.type` 实为 `'left' | 'right'` 却声明 string。待处理（改名 `TransferPaginationProps`、`side`，需维护者决定）。
- 保持原样：`onClear` 在 defaultProps 但未声明；`draggable` 时忽略 `virtualize`。
- React：搜索框的 `inputProps` 展开在 Transfer 传入的 `value`、`onChange` 之后，传入同名属性会接管搜索框，Transfer 的筛选不再跟随输入。待处理（展开前去掉 `value`、`onChange`；其他框架未核对）。

### 跨组件命名

- 公开类型小写开头或拼错（`customRequestArgs`、`optionRenderProps`、`virtualListProps`、`showToolTipProps`、`weekStartsOnEnum`、`stepSizeMapIconSize`、`DropDownMenuItemItem`）。待处理（涉及公开 API，需维护者决定）。
- `_base/base-component.ts` 只剩类型，文件名过时；`button-group.tsx`、`layout/index.tsx`、`tooltip/index.tsx` 未用 `_base/element-type.ts`。待处理（改名 `base-props.ts`，收口）。

## 2 已知未处理的类型与工具链问题

- json-viewer-core：`View.#customRenderRule` 类型漏 `| null`。待处理。
- semi-ui-react：多数回调 prop 仍以 `noop` 为默认值，显式传 `null` 时抛 TypeError。待处理（逐个改为 `?.()`；Select 的 `onFocus`、`onBlur` 被 InputGroup 按 `noop` 识别，同步改）。
- Table：`VirtualizedOnScrollArgs.scrollOffset` 仍声明可选。待决（改必填属公开类型收紧）。
- 公开 Props 类型含内部属性：TextArea 的 `disabledEnterStartNewLine`，Input 的 `showClearIgnoreDisabled`、`onlyBorder`（InputNumber 经继承带上），OverflowList 的 `overflowRenderDirection`，ScrollItem 与 Layout 基础组件的 `type`，各框架范围不一；React 另有 Breadcrumb.Item 的 `active`、`shouldRenderSeparator`、`route`，TabItem 的 `handleKeyDown`、`deleteTabItem`、`selected`，Option 的 `current`，Form.ErrorMessage 的 `errorMessageId`、`helpTextId`、`isInInputGroup`，以及多数组件的 `prefixCls`，生成的 API 表如实列出并注明内部用途。待处理（拆出内部 Props 类型）。
- React：Cascader、Image、UserGuide 的 Props 类型声明 `children` 但不渲染，API 表已注明。待处理（从公开类型去掉）。
- React：`hydrateFromServer` 渲染服务端 HTML 时只移走 `document`，`window` 与其他 jsdom 全局仍在，按 `typeof window` 分支的依赖在服务端与客户端都走浏览器分支，由此造成的 hydration 不一致在 `hydration.test.tsx` 中发现不了。UNKNOWN（影响：这类不一致只由 check-pages 的 SSR 验收覆盖）。解决条件：hydration 用例改为读取 `react-ssr` 项目在 Node 中产出的 HTML。
- React API 表生成器只读组件传给 `useDefaultProps` 的默认值、参数解构的默认值与模块的 `defaultProps`；调用 `useDefaultProps` 之后在函数体内解构的默认值、写在内部渲染组件里的默认值读不到，默认值列显示 `-`，由说明写出实际默认值（Button、Grid、Breadcrumb.Item、CardGroup、Highlight、ColorPicker、Steps、Skeleton、Navigation、Sidebar 等）。已知限制（升级条件：把这些默认值移入组件的默认值对象，或让生成器读取函数体解构，并删去说明里重复的默认值）。
- Solid：ScrollList 的公开类型含内部属性 `x-semi-header-alias`、`x-semi-footer-alias`；TimePicker、PinCode 未声明 `autofocus`（经原生属性可用），生成的 API 表不列出。待处理（内部属性随内部 Props 类型拆分处理，`autofocus` 显式声明后重新生成）。
- `vp pack` 的 d.ts 打包丢失经组件模块再导出的类型（semi-ai-react、semi-ai-vue）。已知限制（升级条件：打包工具修复）。
- Chat、AIChatDialogue：`escapeHtmlInMarkdown` 不识别 4 空格缩进代码块。已知限制（升级条件：改为 remark 插件）。
- `pnpm build:icon` 不幂等：生成器输出单行对象，已提交的 semi-icons-core 数据文件是多行，两种写法都能通过 `vp fmt --check`，重新生成产生约 357 个纯格式差异。待处理（让生成器输出与已提交文件一致，或按生成器输出重新提交一次）。
- semi-ui-vue 的 CodeHighlight、MarkdownRender 测试直接导入 `shiki/langs/*`、`shiki/themes/*`，但 semi-ui-vue 没有声明 shiki 依赖：全新安装后这 3 个测试文件与 `vitest/vue/tsconfig.vue.json` 的类型检查失败，现有工作区靠残留的 `packages/semi-ui-vue/node_modules/shiki` 链接才通过。待处理（在 semi-ui-vue 的 devDependencies 声明 shiki）。
- Solid：webpack、rspack 插件的规则不覆盖 Solid 包，`packages/semi-webpack/src/semi-webpack-plugin.ts` 的 `SEMI_DIST_JS_RE`、`SEMI_DIST_SCSS_RE` 与 `packages/semi-rspack/src/rule.ts` 的三个 `test` 只列了 react 与 vue 的包；Solid 包在 webpack、rspack 下使用插件时 `prefixCls` 不生效（实测 `prefixCls: 'my'` 时按钮背景为 `rgb(239, 239, 239)`）。待处理（正则补 `ui-solid`、`ai-solid`、`icons-solid` 等 Solid 包，并加带 `prefixCls` 的 `solid-webpack`、`solid-rspack` 宿主变体守护；入门页 Solid 块的说明随之更新）。
- Solid：SolidStart 2.1.0（solid-js 1.9.17、@solidjs/router 1.0.0、nitro 3.0.260903-beta、vite 8.3.5）中，root 用 `ErrorBoundary` 包 `Suspense` 时，模块导入阶段就抛错的路由（顶层 `throw`）在 dev 与 prod 下都返回 200 且响应流永不结束，只收到约 1.2 KB 的 shell，服务端日志无该错误，页面请求挂起而不是显示错误边界；渲染时抛错的路由能正常结束并输出 fallback。不含 Semi 的最小复现（只依赖上述五个包）证实与 Semi 无关；症状同 https://github.com/solidjs/solid-start/issues/2260（该问题已随 solid-js 1.9.15 的 lazy 拒绝修复关闭，导入期抛错仍复现）。已知限制（上游问题；升级条件：上游修复后升级 `@solidjs/start` 并删去本条）。
- 工具链 `@vue/language-core` 3.3.12 起 URL 属性在作用域插槽内报 TS6133、TS2304。已知限制（升级条件：上游修复 https://github.com/vuejs/language-tools/pull/6241 发布后升级 vue-tsc）。

## 3 主题与站点

- `packages/semi-foundation/src/locale/source` 的 `Sortable`：6 个键的 55 个非 zh_CN、en_US 译文为机译。待母语者复核（重点 ga、my_MM、km_KH、hu_HU、sw、is、sq、jv_ID、bn_IN、ur）。
- `packages/semi-foundation/src/locale/source` 的无障碍名称与图标按钮名称：zh_CN 与 en_US 以外为机译。待母语者复核（整体 jv_ID、kk、km_KH、my_MM；Rating 数词与复数（斯拉夫、波罗的、芬兰、爱尔兰等语言）；Carousel 的 `indicators`、`slideN`、`carousel`、`slide`（tr_TR `karusel`、hu_HU `karusszel` 可由母语者定）；AIChatInput 的 `send`、`stop`、`upload`；AIChatDialogue 的 `copy`；Tabs 的 `prevTabs`、`nextTabs`；AudioPlayer 的 `playbackRate` 与 VideoPlayer 的 `playbackRate`、`quality`、`route`（zh_CN、zh_TW、en_US、en_GB、ja_JP 以外）；内置图标按钮名称（Toast、Notification、Popconfirm、Calendar、Cascader、Upload、ColorPicker、JsonViewer、Chat、AIChatDialogue、Sidebar 下的键），重点 km、my_MM 的 like、dislike、reference、disable，ceb_PH 的 reference、regenerate，ga、jv_ID、is 整体，he_IL 动词与名词形式统一；Sidebar 文件编辑器工具栏 20 个键，重点 ceb_PH、jv_ID、km_KH、kk、ga、is、sq、my_MM、sw、ur、bn_IN、fil_PH 整体，ms_MY 的 `strike`，fa_IR 的 `alignJustify`；`Table.expandColumn`、`Chat.input`、`Chat.image`、`JsonViewer.content`、`VideoPlayer.progress`、`AIChatDialogue.image`、`AIChatDialogue.selectMessage`、`AIChatInput.input`，重点 ga 全部 8 个键，ceb_PH 的 expandColumn、progress、content 与两个 input，bn_IN、az、et、ar、my_MM、km_KH、jv_ID、kk、ur 的 progress 与两个 input（my_MM 另有 selectMessage），fil_PH、is 的两个 input，he_IL、fa_IR 的两个 input 与 selectMessage，sw 的 expandColumn 与两个 input，sq 的两个 image 与 content，uz 的 selectMessage 与 progress，hu_HU、th_TH、sl 的 progress（hu_HU 现译更接近「状态」），hi_IN 的两个 image，ms_MY 的 image 统一 Gambar 与 imej；Upload 的 `preview`、`upload`；AudioPlayer、VideoPlayer 的 `progress`、`timeHms`、`timeMs`、`timeS`；Resizable 的 `separator`、`resizeWidth`、`resizeHeight`；Cropper 的 `cropArea`、`cropAreaRole`、`cropAreaHelp`；Chat、AIChatDialogue 的 `messages`；ColorPicker 的 `format`；TimePicker 的 `hourList`、`minuteList`、`secondList`、`ampmList`；Slider 的 `rangeStart`、`rangeEnd`；PinCode 的 `digit`；Spin 的 `loading`（重点 ko_KR、my_MM、zh_TW）；Feedback 的 `rating`、`bad`、`normal`、`good`；Input、Select 的 `clear`；TimePicker 与 DatePicker 的 `panel.*`（Range 类直译：sw、uz、ur、th_TH、sq、uk_UA、hu_HU、is、hr、jv_ID、kk、km_KH、lt、lv、ru_RU、sk、nb，以及 ar、bn_IN、cs_CZ、el_GR、fil_PH、ceb_PH 的 range 借词；my_MM 整组；it 动词形式不一致；uk_UA 不定式与祈使混用；tr_TR、sv_SE 的 `timeRange` 与 placeholder 不一致；en_GB 的 `panel.date` 沿用 Select date）；另需复核 ga、is、he_IL、hi_IN、fa_IR 整体，es_419 的空格，et、fi_FI 的合成词）。
- `packages/semi-foundation/src/locale/source` 的 `Table.filterColumnActive`：55 个非 zh_CN、en_US 译文为机译，分隔符 ar、fa、ur 用 `،`，my_MM 用 `၊`，km_KH、th_TH 用空格，ja_JP 用 `、`。待母语者复核（重点 km_KH、th_TH 的空格分隔与 my_MM 的 `၊`）。
- `packages/semi-foundation/src/locale/source/bn_IN.ts`：混用预组合 U+09DF（27 处）与分解形式 U+09AF U+09BC（44 处）。待母语者复核（统一为一种 Unicode 形式）。
- `packages/semi-foundation/src/locale/source/ar.ts`：`Sidebar.defaultMcpInfo` 译文为机译。待母语者复核。
- `website/scripts/gen-vue-api.ts`：经符号链接路径运行时脚本直接以 0 退出。待处理（改为 `import.meta.main`）。
- Table 页「固定表头」一节的示意图只有 React 实现，Vue、Solid 页显示的也是 React 渲染。已知限制（升级条件：各框架各写一份示意）。
- Vue API 片段的默认值列对经 `semiDefault` 读取的属性显示整段表达式（如 `semiDefault("TreeSelect", "treeNodeLabelProp", "label")`，85 个片段共 603 处），看不出实际值。待决（是否只显示第三个参数）。
- `theme-tokens.browser.test.tsx`：用例标题「尺寸 token 声明在 body 上」已过时。待处理（只改标题）。
- `website/content/ai` 的 AIChatDialogue demo：`roleConfig`、`customRender` 在组件内定义使 memo 失效。待处理（提到模块级或 `useMemo`）。
- 保持原样：主题 token 对比度低于 4.5:1（2026-10-13 决定不调整）。2026-10-25 评估过 DSM 的 `@semi-bot/semi-theme-a11y` 色板：React 中文页的 color-contrast 问题从 73 个 demo 增至 237 个（其 blue-5 `#1273ea` 在 Button light 的 `#f5f5f5` 填充上只有 4.12:1），warning 与黄色系仍不达标，不采用。
