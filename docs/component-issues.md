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

## 1 已重写的组件

### Tag、TagGroup、SplitTagGroup

- TagGroup 中文字相同的标签移除前一个时，后一个错位到前一个实例上。已知限制（调用方需提供 `tagKey`）。
- Solid：TagGroup 折叠（`maxTagCount`）后，标签在可见区与 +N 弹层之间移动时重新挂载，已关闭状态不保留（`renderTag` 重新调用）。已知限制（升级条件：需跨折叠边界保留状态时，把关闭状态提升到 TagGroup）。
- Svelte：可点击 Tag 的 aria-label 在服务端首帧缺失，hydrate 后补上（`children` 是不透明 snippet，服务端读不到文本；role="button" 的名称本来来自内容，首帧仍可读）。已知限制（升级条件：Tag 增加显式 `label` prop，或 Svelte 提供读取 snippet 文本的办法）。

### Tooltip（及 Popover、Dropdown）

- 触发器被滚动祖先裁掉一部分时，按裁剪后的可见比例监测移动，只让它露出更多的移动不触发重新定位，要等下一次滚动、resize 或尺寸变化。已知限制（升级条件：有不跟随的实际场景时，对被裁剪的触发器在打开期间按 `requestAnimationFrame` 比较矩形）。
- 受控请求被拒后 `#requestedVisible` 保留到下一次 `visible` 变化，使用方之后自行设为该值时 hover、focus 触发跳过延时。已知限制（只影响时机；升级条件：需按延时生效）。
- 保持原样：Vue 内层 click 加 `stopPropagation` 时焦点仍转发到外层；Slider、Rating 传 `closeOnEsc={false}`；React 直接嵌套 Tooltip 家族不转交外层注入值。
- Vue：hover、focus 触发的弹层内打开 Modal、SideSheet 或图片预览后，指针移入该层会关闭外层。已知限制（升级条件：`use-tooltip.ts` 检查已登记后代）。
- Solid：触发器内部既不是 Tooltip 家族、也不经 `PopupPortal` 渲染的弹层（未登记到 `TooltipPopupsContext`）算作外部，在其中按下鼠标会关闭 Tooltip，除非该弹层自己 `stopPropagation`。已知限制（Modal、SideSheet、图片预览已经 `PopupPortal` 登记；升级条件：出现这类组件时经 `useTooltipPopups()?.register` 登记自己的弹层）。
- Solid：原生 `<button disabled>` 与没有调用 `useSpecialTrigger` 登记的带 `disabled` 的组件不被识别为特殊触发器，内部设置 `role` 的组件作触发器时要在 `own` 中传 `role`。已知限制（升级条件：这些组件需要时登记到 `SpecialTriggerContext`；多处需要 `role` 时改为在 effect 中读 DOM）。
- Solid：触发元素的字符串 `style` 在两次打开之间被重写时冲掉 `pointer-events`。已知限制（升级条件：有需求时监听 `style` 属性变化并补写）。
- Solid：非函数 children 的特殊触发器（disabled、loading 的 Button、Input 等）在 ref 回调中登记，服务端认不出，包裹 span 的 `cursor`、`width` 挂载后才补上（函数 children 展开 `getTriggerProps` 时，组件体内按其 ref 登记，服务端首帧已正确）。已知限制（升级条件：需要首帧样式时，服务端改为按 Tooltip 解析的子项身份查找登记）。
- Svelte：宿主的 `handlePropsChange` 所在 effect 早于组件自己的 effect，受控关闭的出场动画要在 `tick()` 之后才能读到，已按此顺序实现；`keepDOM` 加受控重新打开不受影响（浏览器实测：`show()` 写入 state 后 `syncPopup` 排到下一轮 flush，此时 DOM 已更新）。已知限制（升级条件：宿主 effect 能排在组件 effect 之后）。
- 默认打开（如 `visible` 或 `defaultVisible`）的弹层不进服务端 HTML，触发器的 `aria-expanded`、`aria-controls`、`aria-describedby` 要到挂载后才与弹层一致。已知限制（升级条件：需要首帧即带这些属性时，按 props 在服务端推算）。
- Svelte：`child` snippet 里的 disabled、loading Button 不包裹，原生 `<button disabled>` 不识别，首帧与服务端不识别特殊状态。已知限制（升级条件：`child` 路径需要包裹时用 teleport 搬节点，避免 `{#if}` 切换让 Button 重建丢焦点；首帧需要时让 Button 在服务端登记）。
- Svelte：在外部元素的 mousedown 处理中打开受控弹层（`trigger="custom"`）时，同一次按下是否被判为点击外部而立即关闭。UNKNOWN（React、Vue 已按启用监听时正在派发的 `window.event` 忽略这次按下；Svelte 的 effect 同样在派发途中的微任务里执行，可能命中；解决条件：用 svelte-browser 写同样的复现）。
- React：节点类型的属性（Image 预览的 `leftIcon`、`rightIcon`，Nav 的 `collapseButton`，Table 的 `filterDropdown`，Upload、Copyable 的图标等）由 Server Component 传入时，Next dev 下可能以 lazy 元素到达，`isValidElement()` 不认而走默认分支，与服务端不一致。UNKNOWN（children 位置已用 `useUnwrappedLazy` 解包；解决条件：在 next-app 的 rsc 页面把这些属性放进 Server Component，看 dev 下的 console）。

### Button、IconButton、ButtonGroup、SplitButtonGroup

- React：非元素的 `icon` 不渲染。保持原样（Vue 渲染任意 `#icon` 插槽，Solid 渲染任意 JSX，Svelte 的 `icon` 是 snippet）。
- Svelte：ButtonGroup 分隔线服务端首帧缺失。已知限制（升级条件：改为 CSS 由末项隐藏分隔线，需改 foundation SCSS）。

### Spin

- 保持原样：挂载时已在加载则立即显示，`delay` 不生效。

### Badge、Space、Skeleton

- 保持原样：字符串 `count='5'` 不受 `overflowCount` 截断；Vue Skeleton `loading` 为 false 时 ref 的 `$el` 是 Fragment 锚点。

### Divider

- 保持原样：Vue render 期两次调用默认插槽。

### Empty

- 保持原样：Vue、Solid 每个实例各挂一个 MutationObserver（React、Svelte 只有传了 `darkModeImage` 的实例才观察 body，不受影响）。

### Timeline

- Svelte：提供 `time`、`extra` snippet 后所有项都渲染对应容器（Svelte 读不到 snippet 对某项是否有输出）。已知限制（升级条件：需要逐项隐藏容器时改 API）。

### BackTop

- 不做：`description`。
- 保持原样：改 `visibilityHeight` 后等下次滚动才判断；`prefers-reduced-motion` 下仍平滑滚动；Vue 开发期警告每次更新重复。
- Svelte：保持原样。开发期的交互元素警告只在 `children` 属性或按钮元素变化时重查，snippet 内部内容变化时不重查。

### FloatButton、FloatButtonGroup

- 保持原样：子项 key 用下标。

### Highlight

- 保持原样：Vue 数字样式不补 `px`。

### Descriptions

- 横向布局一行多组 th/td 且无 `scope`、`headers` 关联。UNKNOWN（读屏可能读不出键值对应；实机核实后用 `useId` 加 `headers`）。

### Layout、Header、Footer、Content、Sider

- 保持原样：Sider `breakpoint` 只挂载时读取；`hasSider={false}` 去不掉 has-sider class；根元素为 `section`；React、Vue、Svelte：深层 Sider 在 SSR 首帧缺 `has-sider`；Vue 渲染期读默认插槽最多执行两次。

### Collapsible

- 保持原样：收起态预览区不设 `inert`。

### CodeHighlight

- 保持原样：加载失败的 rejection 未处理。
- 保持原样：shiki github-light 的 `#E36209` 对比度 3.48:1；语法配色来自 Shiki 主题，check-pages 不计入 `.shiki` 内的 color-contrast。

### MarkdownRender

- Solid：按顶层块复用 DOM，流式输出时正在变化的整段或整个列表连同其中的图片、CodeHighlight 一起重建。已知限制（升级条件：需要元素级复用时，按 key 递归复用子节点）。
- Solid：mdx 格式与使用异步插件的 md 格式，服务端 HTML 与客户端首帧没有正文，挂载后编译完成才出现。已知限制（升级条件：服务端渲染能等待异步编译时，在服务端完成编译）。
- Svelte：不带 `node` 直接使用 `defaultComponents` 时，`p` 不检测图片、`code` 不高亮、`pre` 保留外层、`table` 为空。已知限制。
- Svelte：自定义 `td`、`th` 不会被渲染，`table` 只取单元格内容交给 Semi Table（Vue 相同）。已知限制。
- Svelte：`runtime.ts` 靠 `_createMdxContent` 函数名识别 wrapper 内容。已知限制（升级条件：MDX 编译产物提供稳定标识）。

### List、List.Item

- 保持原样：有 dataSource 无 renderItem 时不渲染也无空状态；grid 模式 li 无 ul 父元素；Item 的 `onContextMenu` 被覆盖；`grid` 的 className、style、ref 传给每个 Col。
- Solid：List.Item 在可点击与不可点击之间切换时重建 children，其中的状态丢失。已知限制（升级条件：需要保留状态时改为在 effect 中搬动同一批节点）。
- Svelte：ListItem 在可点击与不可点击之间切换，或 `header`、`main` 出现与消失时，`children` 在 button 内外移动，其中的状态丢失。已知限制（升级条件：需要保留状态时改为固定位置渲染 children）。
- Svelte：`children` 内用 `{#if}`、`{#each}` 渲染出 0 项时 snippet 仍存在，不显示空状态。已知限制（升级条件：Svelte 提供判断 snippet 是否渲染出内容的办法）。

### Lottie

- 保持原样：`params` 显式传 `container: undefined` 覆盖包裹节点。
- 开发环境的表达式告警只检查 `params.animationData`，`params.path` 加载的数据不检查。已知限制（升级条件：需要时在 lottie-web 的 `data_ready` 事件里检查已加载的数据）。

### HotKeys

- 保持原样：根 div 带 `onClick` 无 role 与键盘处理；Vue 默认插槽可能执行两次。
- Solid：`render` 返回 `undefined` 与不传 `render` 无法区分，都显示默认按键内容。已知限制（升级条件：有实际需求时区分显式 `undefined`）。
- Svelte：`children` snippet 渲染为空时根元素仍渲染，Svelte 无法判断 snippet 有无输出（Vue 插槽为空时不渲染根元素）。已知限制（影响只限空 snippet；升级条件：Svelte 提供判断 snippet 有无输出的办法）。

### DragMove

- 保持原样：destroy 不还原 `cursor: move`；`allowMove` 只识别 input、textarea；无键盘移动方式。
- Solid：只绑定顶层 HTMLElement，SVG 根元素不可拖动（React 绑定所有宿主元素）。已知限制（升级条件：foundation 与 props 类型放宽到 Element）。
- Solid：内联尺寸与定位要测量后才写入，服务端 HTML 不含。已知限制（升级条件：需要首帧即正确时，按 props 推算）。
- Svelte：被拖元素上的响应式 `style` 属性更新时会覆盖拖动写入的 `position`、`top`、`left`，要用 `style:` 指令写其他样式。已知限制。
- Svelte：传入新的 options 对象会让 attachment 重新运行，进行中的拖动会中断；options 的字段在拖动时才读取，可以传稳定对象并改其字段。已知限制。

### Collapse、Collapse.Panel

- 保持原样：Panel 脱离 Collapse 抛错；溢出滚动的内容区不可聚焦；Vue `everOpened` 在渲染期写入。
- Solid：`keepDOM` 加 `lazyRender` 下内容区消失后 `aria-controls` 的复位只在不再传 `children` 时生效，`children` 为 `null`、`false` 时仍视为有内容（已有 `it.fails` 用例）。已知限制（升级条件：Panel 改为按求值后的 children 判断有无内容）。
- Svelte：`header` 是 snippet，读不出是否纯文本，`.semi-collapse-header-right` 总是渲染，元素标题没有 `extra` 时多一个空 span，与 Vue、Solid 不一致。已知限制（升级条件：`header` 同时接受 `string`，或 foundation 提供是否需要间隔的判断）。

### PinCode

- 保持原样：输入框为空时 Backspace 仍调用 onChange；Backspace、Delete 无受控判断；`blur` 的 `handleCurrentActiveIndexChange` 不做事；其他 format 不限制字符；Form 注入的 `name` 被丢弃。
- 不做：点击空格子不重定向焦点。
- 输入法多字符 `data` 取最后一个字符。已知限制。

### Avatar、AvatarGroup

- 保持原样：topSlot、bottomSlot 只在 6 个预设尺寸渲染；`destroy()` 为空；AvatarGroup 包装元素内多个 Avatar 共用重叠序号。
- Solid：文字头像的缩放 `transform: scale(...)` 要测量后才确定，服务端 HTML 不含缩放。已知限制（升级条件：首帧文字溢出成为问题时，改为按字数推算初值）。
- Solid：AvatarGroup 在首帧与服务端还不知道子节点的位置，按 Avatar 的创建顺序计数 `maxCount`，挂载后才按子节点位置计数：子节点之间夹有文字或包装元素（`<Tooltip><Avatar /></Tooltip>`、`<div>`）时，首帧可能隐藏包装元素里的头像，包装元素收到 token 后显示为空（在数组中显示为「[object Object]」），挂载后恢复；超出 `maxCount` 的包装元素整体交给 `renderMore`，默认 `+N` 的名称不含其中头像的 `alt`；新增的头像在列表协调前先创建，协调后超出 `maxCount` 的再释放。已知限制（升级条件：包装元素里的头像需要在服务端正确渲染时，让包装元素也向组登记）。
- Solid：默认 `+N` 头像的名称只列被隐藏头像的 `alt`，因为隐藏头像不创建，读取子节点会创建它们。保持原样（需要名称时给头像传 `alt`）。
- Svelte：服务端首帧的文字头像没有 `aria-label` 与缩放，挂载后补上；元素内容的头像首帧先套文字结构再切换。已知限制。

### Breadcrumb、Breadcrumb.Item

- 保持原样：`moreType="popover"` 时点击 Popover 内链接冒泡并展开所有项。

### JsonViewer

- 保持原样：`options` 含内联 `customRenderRule` 时每次父级渲染都重建编辑器；`staticCompletions` 只在按文档结构推断出候选项时追加，推断不出时不提供（上游自引入起即如此，没有文档、demo 或用例表明其他意图，文档站 API 表已按此写明）。
- Solid：编辑器在 `onMount` 中创建，服务端 HTML 与 hydration 前只有空的内容容器，挂载后才插入行号与内容区；搜索按钮的拖动层也在挂载后才写入 `cursor`、`touch-action`。hydration 用例只校验无报错，不比较挂载前后的结构。已知限制（升级条件：需要无 JS 或首帧可读时，服务端按 `value` 输出只读的格式化文本，并让用例的 `mountDiff` 收窄为属性列表）。
- Svelte：`customRender` snippet 渲染不出内容时，组件只在首次渲染时检查一次并补回原文本，之后才开始渲染内容的 snippet 会与补回的文本并存。已知限制（升级条件：有实际用例时改为持续监听，MutationObserver）。
- Svelte：函数绑定 `bind:value={get, set}` 的 setter 拒绝或改写文本时，编辑器销毁重建以恢复一致，光标位置丢失。已知限制。
- 浏览器用例「编辑」与覆盖率、站点扫描同跑时偶发 15 秒超时。UNKNOWN（影响：偶发 FAIL；worker 首次回复前编辑抛错、后续重绘与补全丢失的缺陷已修，但单独加慢 worker 只复现出 1 秒的断言失败，没复现出 15 秒超时；解决条件：下次 `check:full` 观察，仍出现时把「编辑」拆成编辑撤销、补全、搜索替换三条用例并定位慢的一段）。

### Carousel

- 保持原样：`autoPlay`、interval 变化等下次切换；不经 onChange 改 `activeIndex` 无动画；`arrowProps.*.props` 替换内置 `onClick`；`goTo` 不重置计时。
- Svelte：自定义箭头是否有可访问名称只在挂载时读一次 DOM，之后 snippet 文本变化不重新判断。已知限制（升级条件：出现动态文本箭头的需求）。
- Svelte：幻灯片的 `id`、`aria-label` 由 Carousel 在包装元素上生成，使用方不能单独指定。已知限制。

### Cropper

- 保持原样：切换 src 后 zoom、rotate 不重置。
- RTL 下图片、裁剪框与预览只设 `transform` 不设物理 `left`，绝对定位的静态位置落在右侧，推测会错位。待处理（处理方式：在 RTL 下截图确认，成立则让定位层固定 `direction: ltr` 或补 `inset-inline-start: 0`）。
- Solid：内联尺寸与定位要测量后才写入，服务端 HTML 不含。已知限制（升级条件：需要首帧即正确时，按 props 推算）。

### Pagination

- 保持原样：受控页码超过总页数时列表为空；total、pageSize 变化回第 1 页；warning 拼写 "ths"；small 模式 `total` 为 0 显示「1/0」。

### Steps

- 保持原样：Step 在 Steps 外使用抛错；basicSteps 单独使用产生空后缀类名；React、Solid、Svelte 的 Step 在展开属性之后设置 `tabIndex`，传入的值被可点击状态覆盖（Vue 未核对）；可点击 Step 的 `role="button"` 包住整个步骤内容（Ant Design、MUI 的可点击步骤同样整块作为按钮）。

### Radio、RadioGroup

- 保持原样：onChange 事件对象无 `nativeEvent`；受控 `checked` 为非布尔值被忽略。
- Solid：不在 RadioGroup 中的同名受控 Radio，选中其中一个后其余几个的原生选中状态不回写（React、Vue 相近）。已知限制（升级条件：出现脱离 RadioGroup 使用同名受控 Radio 的需求时，按 name 在文档范围内登记同步）。

### Checkbox、CheckboxGroup

- 保持原样：Form 重置时输出 "value should be an Array" 警告。

### Anchor、Anchor.Link

- 保持原样：只滚动最近的可纵向滚动容器；原生平滑滚动卸载时无法取消。
- React、Vue：`autoCollapse` 下，折叠的 Link 里经其他组件渲染的子链接在挂载前无从得知，`defaultAnchor` 指向它时父项不展开（直接写在 Link 里的子链接、已挂载的链接与滚动高亮不受影响；Solid 解析实际渲染结果、Svelte 的层级来自 `links` 数据）。已知限制（升级条件：有实际需求时让折叠分支以隐藏方式渲染，使其中的 Link 能登记）。

### ScrollList、ScrollItem

- 保持原样：首项 offsetTop 为 0 被当作未知；`scrollToIndex` 的 `selectedIndex` 参数不被使用。
- cycled wheel 滚动时按整段副本跳转 `scrollTop`，真实触控板与 iOS Safari 的惯性滚动可能被打断。UNKNOWN（影响：滚动手感；解决条件：真机验证，受影响时改为滚动停止后再跳转）。

### OverflowList

- 保持原样：切换 renderMode 不重置派生的 visible。
- 测量完成前根元素带 `visibility: hidden`，服务端 HTML 与 hydration 前整个列表不可见，由 ResizeObserver 测量后显示。已知限制（升级条件：需要无 JS 或 hydration 前可见时，首帧改为全部渲染再由测量收起）。

### Resizable、ResizeGroup、ResizeItem、ResizeHandler

- 保持原样：React Handler 的 `direction`、`onResizeStart`、`disabled` 声明但不生效（Vue、Solid 不提供）；动态增删子项不重新分配比例；ResizeGroup 直写子项 `style.width/height`。
- Solid：分隔条的 `aria-valuemin`、`aria-valuemax`、`aria-valuenow` 与各项尺寸依赖布局，挂载后才写入，服务端 HTML 中分隔条可聚焦但没有这些值。Vue：ResizeGroup 的项尺寸（`width: calc(...)`）与分隔条的 `aria-valuenow`、`aria-controls` 同样挂载后才写入。已知限制（升级条件：需要首帧即正确时，按 props 推算初值）。
- Svelte：ResizeItem 的 `style` 变化会丢掉 ResizeGroup 写入的宽高，使用方要保持 `style` 不变。已知限制。

### Portal

- 保持原样：`didUpdate` 在仓库内无使用方。

### CSSAnimation

- 保持原样：animationend 每次触发都重复调用 `onAnimationEnd(false)`；`stoppedByAnother` 含义失真；`onAnimationStart` 调用两次；SubNav、Table 展开图标的 `isAnimating` 恒为 true。

### ConfigProvider、LocaleProvider、LocaleConsumer

- 保持原样：`ContextValue.children` 从未赋值；LocaleConsumer 无 `children` 时抛错。
- Svelte：父级传入内容相同的新对象时，`useConfig()` 的消费者 effect 多重跑一次（`inherited` 每次产出新对象），不重新注册 matchMedia、不重复通知订阅者。已知限制（升级条件：逐字段 `$derived`）。
- 不做：`screens` 跨断点让所有读 ConfigContext 的组件重渲染（实测低于 16ms；超过时拆独立 context）。

### ResizeObserver

- 保持原样：`delayTick` 从未读取；observeParent 只观察 HTMLElement 父元素。
- Solid：`observeParent` 取子元素挂载后的父元素，之后子元素被搬到别的父元素时不更新。已知限制（升级条件：有实际需求时在 effect 里订阅父节点变化）。

### Popover、Popconfirm、Trigger

- 保持原样：Popconfirm 的 `onConfirm`、`onCancel` 实际收到 `e.nativeEvent`。
- Solid：Popconfirm 卡片的 click 用 `stopImmediatePropagation` 对 document 监听隐藏，同一次点击不再到达 Tooltip 容器与外层的委托处理函数（`clickToHide` 在卡片内不生效）。已知限制（升级条件：出现需要 `clickToHide` 的 Popconfirm 用法，或 Tooltip 提供卡片内点击的统一出口）。

### Dropdown、Dropdown.Menu、Dropdown.Item、Dropdown.Title、Dropdown.Divider

- 保持原样：Item 自己的 `showTick` 不生效；Vue Item 的 `@click.once`、`@click.capture` 不走顶层分流；Vue 挂起的打开请求期间设 `visible` 为 true 不触发 `visibleChange`；DropdownDivider 不读 `overrideDefaultProps`。
- React、Solid：浏览器用例「悬停子菜单被 … 关闭后，父项上按 ArrowRight 再次打开」在三个框架的浏览器全量测试同跑时偶发失败：子菜单已打开（父项 `aria-expanded="true"`），但首项没在 `waitFor` 时限内获得焦点；单独重跑通过。待处理（根因 UNKNOWN，先确认打开后聚焦首项依赖的时序）。
- Svelte：`icon` 和 `menuIcon` 的容器在 snippet 输出为空时也会渲染，Vue 版会隐藏。已知限制（升级条件：Svelte 能在渲染前判断 snippet 是否有输出）。
- Svelte：`visible` 未绑定时，首次打开关闭后 foundation 走受控路径，限制继承自 Tooltip。已知限制。
- Svelte：触发子元素禁用时，Dropdown 外层 span 没有 `cursor: not-allowed`（Vue 有），只是视觉差异。已知限制。

### ColorPicker

- 保持原样：AlphaSlider 忽略 `className`；两个 SliderWrapper 无样式；`isHandleGrabbing` 不参与渲染；`children` 只在 `usePopover` 时生效；`width`、`height` 为 null 回退 280；Svelte 不提供 `defaultValue`，受控 `null` 显示内置默认色（Svelte 包不提供 `default*` 属性，初值由 `bind:value` 的初始值给出）。

### SideSheet

- 保持原样：Vue 遮罩离场比内容长时被截断。
- Svelte：离场结束只看内容面板的 `animationend`，遮罩动画比面板长时被截断，与 Vue 的保持原样一致。已知限制。

### Notification、Notice

- 保持原样：React、Solid 直接渲染 `<Notice>` 不传 `type` 带 `-undefined` class（Vue、Svelte 已判空）；`useNotification` 不支持传 `id` 原地更新；根元素 `onClick` 无键盘方式。
- Svelte：进场离场是手写的 CSS 动画模型，不走 Svelte transition；主题或用户 CSS 取消动画时，靠 `getAnimations()` 判断并立即结束，不触发 `animationend`。保持原样。

### Slider

- 保持原样：`aria-required` 不输出；受控时每次变化都触发 `onAfterChange`；min、max 变化不重新 clamp；touchmove 是被动监听；外层 Tooltip 注入的鼠标事件被覆盖。
- 不做：Firefox、Safari 的方向键验证。

### AudioPlayer、VideoPlayer

- 保持原样：语言包键 `locale.AudioPlayer.loop` 无使用方；文档 `playbackRateList` 说明与实际不符。
- 保持原样：VideoPlayer 进度条悬浮提示在没有 markers 时渲染一个空的标记标题 div（`markersList` 至少有一项；Vue、Svelte 相同）。

### Toast

- 保持原样：`close(id)`、`destroyAll` 不调用 `onClose`；`destroyAll` 无离场动画；`getPopupContainer` 返回 null 抛错；useToast 的 `defaultOpts` 忽略 `Toast.config()`；无 `type` 带 `-undefined` class；`getWrapperId()` 公开；Vue 多 app 共用只继承最后安装的上下文。
- 播报区在真实读屏器中未验证（相同文本 1 秒内连播可能不播报）。UNKNOWN（需 VoiceOver、NVDA 实机核对）。
- Solid：`useToast`、`useNotification` 的 `contextHolder` 在调用 hook 时创建，只读调用处的 context，放置处外层的 Provider 不生效。已知限制（升级条件：需要按放置位置读 context 时，改为像 Vue 那样返回 Holder 组件）。
- 指针悬停在 hook 列表上时把 `contextHolder` 移出文档再放回，列表仍按悬停暂停，直到指针再次进出（Notification 同）：浏览器移除节点时不补发 `mouseleave`；焦点在列表上时不受影响，移除会触发 `focusout`。Solid、React 已在浏览器实测，Vue、Svelte 同样只靠 `mouseenter`、`mouseleave`。已知限制（升级条件：有低成本的 DOM 脱离信号后在脱离时清除悬停）。
- Svelte：进场离场是手写的 CSS 动画模型，不走 Svelte transition；主题或用户 CSS 取消动画时，靠 `getAnimations()` 判断并立即结束，不触发 `animationend`。保持原样。

### UserGuide

- 保持原样：Vue 受控 `current` 的 watch 为 `flush: 'post'`，一次 flush 渲染两次。

### Tabs、TabBar、TabPane、TabItem

- 保持原样：`handleArrowClick` 改写传入数组；TabPane 脱离 Tabs 或 `more` 非法值抛错。
- Vue：`collapsible="auto"` 缩小到折叠后，放大到比全部标签总宽多 6px 时仍保持折叠。UNKNOWN（是否为有意的回差未核对；对照 React 同一情形后决定）。
- Solid：TabPane 的内容按 Tabs 中的渲染位置查找 context，夹在 Tabs 与 TabPane 之间的 Provider 不生效；非 TabPane 的内容子节点读不到 TabsContext。保持原样（同 Solid 的 Switch、Match；升级条件：token 记下 `getOwner()`，父组件通过 `createRoot((dispose) => { onCleanup(dispose); ... }, owner)` 读取）。
- Solid：`tabBarExtraContent` 的 `float` 只在内容解析时从元素 `style` 读取一次。已知限制（升级条件：有需求时改为响应式读取）。
- Solid：数据 token 在收集方之外以数组插入时渲染为 "[object Object]"，收集方要自行滤掉 token。已知限制（彻底消除需改变 `createToken` 的返回值形态）。
- Solid：`collapsible="auto"` 记住的折叠宽度只在页签增删或换序时重置，标题变长或变短不重置。已知限制（升级条件：出现标题动态变化后需要重新展开的需求时，改为在 TabItem 尺寸变化时重测）。
- Solid：`collapsible` 的折叠要测量后才确定，服务端 HTML 中页签全部展开，挂载后再收进菜单。已知限制（升级条件：首屏布局移动成为问题时，按 props 推算首帧）。
- Svelte：没有长期的 axe 测试（`axe-core` 不是 Svelte 包依赖），只有 Chromium 下的 AX 树测试，Firefox、WebKit 下折叠模式的 AX 树未测。已知限制。

### Modal、ModalContent、ConfirmModal、useModal

- 保持原样：onOk、onCancel 返回被拒绝的 Promise 时 foundation 再次抛出；显示期间副作用绑在「打开到离场动画结束」上；React、Solid 组件版 Modal 的 Props 类型含 foundation 的 `content`（供命令式方法使用），组件版不渲染，API 表已注明。
- Vue：Modal 的离场动画时长为 0 时，约 3 帧内连续关、开、关，第二次离场的 after-leave 不触发，对话框保持显示，焦点陷阱与滚动锁不释放（卸载时释放）。原因在 Vue 3.5 的 Transition：被取消的那次离场排期的 `nextFrame` 回调把新离场的 `el._isLeaving` 清掉，新离场的 `done` 不再调用。默认主题的离场时长为 120ms，不触发；SideSheet 等其他用 Transition 的弹层未核对。已知限制（升级条件：上游修复 [vuejs/core#16134](https://github.com/vuejs/core/pull/16134) 发布后升级依赖；或有使用方把时长设为 0 时，在 `modal-content.vue` 给 Transition 写显式 `onLeave(el, done)`，由 Semi 结束离场）。
- `aria-modal` 对话框外 Portal 到 body 的下拉 listbox 是否被读屏视为不可达，未在 VoiceOver 与 NVDA 验证（含 SideSheet、Image 预览）。UNKNOWN（需实机核对）。
- Svelte：`keepDOM` 加 `lazyRender={false}` 且一开始隐藏时，挂载时的 autofocus 在 `display:none` 下失败，默认按钮获得焦点。已知限制。

### Navigation（Nav、Item、Sub、Header、Footer）

- 保持原样：children 写法重渲染重建菜单；受控 `openKeys` 不驱动水平或折叠弹层；禁用链接项仍跳转；内联 `items` 字面量。
- Vue：包装 Nav.Sub 的组件只作为一项收集，Nav 不调用其默认插槽，子项不参与默认选中项的祖先展开。已知限制（升级条件：改为像 rc-menu 那样在隐藏容器里渲染一遍子项来收集）。
- 包装 Nav.Item 的组件内部写死 `itemKey` 时 Nav 读不到。已知限制（顶层时嵌成 `li > li`）。
- RTL 下布局未做改动前后对比。UNKNOWN（补 RTL 布局快照比对）。
- context 字段仍是可选。不做（开启 `strictNullChecks` 后改必填）。
- Solid：用 `items` 渲染时，新的 `items` 数组重建所有行，持有焦点的行失焦（React 按 key 保留）。已知限制（升级条件：按 itemKey 复用 Nav.Item 与 Nav.Sub 的 token）。
- Solid：图标尺寸适配（`utils/icon-slot.ts`）无法区分写成 `size="default"` 与未写尺寸的图标，Breadcrumb、Toast、Notification、确认框同样受限。已知限制（升级条件：图标组件提供显式的尺寸标记）。在插槽之外创建的图标元素（数据对象里的 JSX，如 `Modal.confirm({ icon })`）拿不到插槽的类名与尺寸类，这些类在 effect 里加上，服务端 HTML 不带，hydration 后才出现。已知限制（升级条件：这类入口改为渲染函数，在插槽内创建）。
- Solid：Nav.Sub 里 Nav.Item、Nav.Sub 以外的内容在 Nav 祖先的 context 下创建，放进 Dropdown 弹层后读不到该 Dropdown 的 context。已知限制（升级条件：改为在 Sub 视图里解析内容，itemKey 另做一次解析来收集）。
- Svelte：children 写法无祖先自动展开、无顶层 Sub 选中标记（Nav 读不到子树）。已知限制（升级条件：Svelte 提供不依赖向上注册、首帧可用的子树读取机制）。
- Svelte：`icon` snippet 无法判空，图标列总是保留。已知限制。

### Typography（Text、Title、Paragraph、Numeral、Copyable）

- 复制成功后读屏播报因读屏而异。UNKNOWN（需实机读屏核对）。
- 保持原样：省略加 `showTooltip` 且含复制按钮时，Tooltip 包住整个根元素，复制按钮在触发器内（Ant Design、Arco 同样包整个根）；只设 `expandText` 不设 `expandable`（`collapseText` 同）时按钮只触发 `onExpand`、不展开，作为由使用方处理的操作按钮，不带 `aria-expanded`。
- Solid：`ellipsis` 截断后插入的是字符串 `ellipsisContent`，children 的解析结果仍被创建而不插入（截断只在客户端发生，不影响 hydration）。已知限制（升级条件：截断文本改为从非 JSX 来源派生时，只在未截断分支里解析 children）。
- 保持原样：Solid 的 `link`、`delete`、`strong`、`underline`、`code`、`mark` 与 `ellipsis` 的有无在运行时变化时增删包裹元素，children 重新创建（子组件状态丢失），与 React 换包裹元素时子树重新挂载一致；省略、展开、收起不变更包裹层，不受影响。
- 保持原样：Numeral `bytes-*` 浮点误差；Vue Numeral 整段格式化。
- Svelte：文本取自 DOM（snippet 不透明），所以隐藏的全文 span 常驻。已知限制（升级条件：foundation 支持不依赖 DOM 的文本来源）。
- Svelte：挂载后才渲染的图标保持自身尺寸，不随文字 size 变小（icon snippet 内的 Semi 图标挂载时才取 size）。已知限制。
- Svelte：Numeral 的 SSR 首屏是未格式化文本，hydration 后格式化。已知限制。

### Input、TextArea、InputGroup

- Input 在输入法组合中失焦是否需像 TextArea 按 `maxLength` 截断未验证；Vue TextArea 同设 `maxlength` 与 `composition` 时受控或 `v-model.lazy` 下失焦截断可能与显示文字不一致。UNKNOWN（需真实输入法复现、补用例）。
- 自动填充用延迟 `transition` 保持主题颜色，只在 Chromium 中实测，Firefox、Safari 未验证。UNKNOWN（影响：这两个浏览器可能仍显示自动填充底色；解决条件：真实浏览器保存表单数据后实测）。
- 保持原样：未声明属性落在原生 input；内部 Input 的全局默认值按 F7 由宿主显式挡掉；TextArea 清除按钮在 `click` 清除；TextArea 读 InputGroup 的 `disabled`（不读 size），React 原先只有直接子项经 cloneElement 拿到，现为任意深度（Ant Design 的 TextArea 同样读外层的 disabled）。
- Solid：在图标槽位（Input、Select 等的 `prefix`、`suffix`，Toast、Notification、Modal.confirm 的 `icon`）之外预先创建的图标元素读不到槽位 context，服务端 HTML 不带槽位的尺寸与类名，挂载后才补上。已知限制（升级条件：首帧图标尺寸跳变成为问题时，数据对象的 `icon` 改为接受图标组件）。
- Svelte：prefix、suffix、addon 的内容是文本、图标还是其他节点靠挂载后观察 DOM 判定，首帧先按其他节点渲染，随后修正。已知限制（升级条件：出现可测的首帧闪烁）。

### Image、ImagePreview 及预览子组件

- RTL 下 prev/next 按钮竖向居中未目视核对。UNKNOWN。
- 保持原样：点击缩略图打开预览触发 `onChange`；`preview.defaultVisible` 不支持。
- Solid：Image 的预览入口（`role="button"`、`tabindex="0"`、`aria-haspopup`）挂载后才写入，服务端 HTML 与 hydration 前图片不可操作。已知限制（升级条件：需要首帧即可操作时，按 `preview` 与加载状态在渲染期推算）。
- Svelte：分组列表里有重复的 src 时，点击任一张都打开第一个出现的位置。已知限制。

### Feedback

- radio、checkbox 选项组无默认可访问名称。已知限制（用 `radioGroupProps`、`checkboxGroupProps` 的 `aria-label`）。
- 保持原样：popup 的 onOk、onCancel 返回被拒绝 Promise 时再抛。

### TagInput

- 保持原样：`setFocusing` 与 `toggleFocusing` 职责重叠；React、Solid 的 `restTagsPopoverProps.content` 替换 +N 浮层里的剩余标签（Vue 的 Popover 没有 `content` 属性，Svelte 的 `content` 写在展开之后，不会被替换）。
- 上一次放下的动画未结束（约 1 秒内）时开始键盘拖拽，方向键不移动项（React、Vue、Solid）。已知限制（@dnd-kit/dom 的 KeyboardSensor 在拖拽状态回到 idle 前忽略按键；升级条件：dnd-kit 改变此行为）。
- Svelte：拖拽排序（内部模块 `internal/sortable`，Transfer 同样适用）的 `items` 变序时，Svelte 会移动被重排项的节点，浏览器让持有焦点的手柄失焦（Vue 版保留焦点）。已知限制（升级条件：改成只移动没有焦点的节点）。
- Svelte：拖拽排序所用的 `@dnd-kit/svelte` 没有 `OptimisticSortingPlugin`，拖动中的视觉顺序由组件自己的预览列表驱动，松手后清除。已知限制。
- Svelte：prefix、suffix 是文本还是图标要挂载后才知道，服务端首帧不带 `-prefix-text`、`-prefix-icon` 类。已知限制。

### AutoComplete

- 浏览器用例「下拉宽度不小于触发器宽度」连跑时偶发 109px。UNKNOWN（复现时记录弹层的 `--semi-tooltip-trigger-width` 与触发器宽度）。
- 只用 `<label for>` 命名时 listbox 无名称。已知限制（传 `aria-label` 或 `aria-labelledby`）。
- 保持原样：`onChangeWithObject` 声明未读取；`loading` 时方向键、Enter 仍打开面板。
- Vue、Solid、Svelte：`defaultOpen` 的 AutoComplete 挂载后才打开，服务端 HTML 中触发器 `aria-expanded="false"`。已知限制（见 Select）。
- 保持原样：Svelte 传了 `renderSelectedItem` 时，输入框显示的是 `value` 本身，`value` 要用 `renderSelectedItem` 的返回值（Vue 的 `modelValue` 相同）。

### Table

- `virtualized` 的表体有列未声明数值 `width` 时，服务端 HTML 与 hydration 首帧没有表体行，挂载测量后才渲染。已知限制（升级条件：需要这类列的首帧行时，给列宽一个估计值）。
- 保持原样：Vue `column-selection.vue` 的 `originNode` 用 `h` 拼成，不进 block tree（它要作为 VNode 值传给 `#selectionCell` 插槽，模板产不出；ant-design-vue、Element Plus 的选择列同样用 JSX 或 `h`）。
- 固定表头或虚拟化时可聚焦滚动容器位于 `role="table"` 内，axe 报 `aria-required-children`；这个容器不加 `role="group"` 和名称，加了会把表格与行隔开。已知限制（示例留基线）。
- Solid：`expandIcon` 的 `semi-table-expandedIcon-show`、`-hide` 类在 effect 里按展开状态加到使用方的节点上（元素与函数形式都是），服务端 HTML 不带，hydration 后才出现。已知限制（升级条件：函数形式的参数增加 `class`，由使用方写到自己的元素上，并取消对使用方节点的就地改写）。
- Vue、Solid：`--semi-table-section-width` 要测量后才写入，服务端 HTML 中表格区段宽度未定。已知限制（升级条件：首屏布局移动成为问题时，按列宽推算初值）。
- 不做：列宽拖动手柄的键盘操作（APG 无对应模式；升级条件：出现需求时按 Resizable 的 separator 模式实现）。
- 保持原样：根类名 `semi-table-wrapper-undefined`；只应用第一个排序器；受控 currentPage 不调用 onChange；RTL 虚拟化与表头阴影；`OnHeaderCell<R>` 使 `ColumnProps` 对 R 不变；`rowSelection.disabled` 阻止 `clickRow`；`handlerClassName` 默认 `'resizing'`。
- Svelte：虚拟化的行高只取自 `itemSize`（数值或按行返回数值的函数），不测量实际高度。已知限制（升级条件：`internal/virtual-list.svelte` 提供测量接口后支持动态行高）。
- 列宽拖拽的覆盖值按列 key 存，列既无 `key` 也无 `dataIndex` 时 key 是 `${level}-${index}`，列顺序变化后覆盖值跟着位置走。已知限制（升级条件：给列加 `key` 或 `dataIndex`）。
- Svelte：`table.svelte` 不是泛型组件，`ColumnProps`、`TableProps` 的行类型为 `Record<string, any>`，snippet 与回调里需 `as` 收窄。已知限制。
- Svelte：`components` 只接受标签名字符串，不能换成组件（可排序行等做不了）。已知限制。
- Svelte：`onScroll` 只带 `scrollOffset`，没有方向。已知限制。

### Tree、TreeNode、NodeList、AutoSizer

- `loadTreeNode` 在 `loadData` reject 时清掉 loading 状态，reject 照常抛给调用方；单测没有覆盖该分支（会变成未处理的 rejection 让 vitest 失败）。已知限制（升级条件：测试里能安全捕获 rejection 时补用例）。
- 保持原样：`hideDraggingNode`、`renderDraggingNode` 拖拽时向 body 追加拖拽图元素，下一个 tick 移除（`setDragImage` 要求元素在 dragstart 时已在文档里）；`prevProps` 存放在 foundation state（与 rc-tree 的 `getDerivedStateFromProps` 相同，只在变化的字段上重算）。
- 键盘模型用 `aria-activedescendant` 而非 roving tabindex。UNKNOWN（VoiceOver、NVDA 实机验证）。
- 保持原样：动画中 treeData 变化 NodeList 停在旧节点；Tree 不支持 children 写法；行内按钮 click 冒泡触发 `onSelect`；Enter、Space 不随 `expandAction` 展开。
- Solid：Tooltip 包 Tree 只能用元素 children，外面多一层 `tabindex="-1"` 的 span，`aria-describedby` 不落在 `role="tree"` 上；函数 children 的元素 `ref` 与 Tree 交出 `TreeHandle` 的 `ref` 冲突。已知限制（升级条件：有需求时给 Tree 加元素 ref prop）。
- Solid：`expandIcon` 为元素时，`semi-tree-option-expand-icon` 类与展开点击监听在 effect 里加到使用方的元素上，服务端 HTML 不带该类，hydration 后才出现；函数形式创建时就收到 `class`，不受影响。已知限制（升级条件：取消元素形式，只保留函数形式）。
- Svelte：无法判断 snippet 输出是否为空，`icon`、`search`、`emptyContent` 传了就替换内置内容，不能像 Vue 那样在插槽为空时回退到默认内容。已知限制（升级条件：Svelte 能在渲染前判断 snippet 是否有输出）。

### Cascader、Cascader Item

- 保持原样：不用 `aria-owns`；点击标签后移除焦点落 body；多选搜索无当前项时 Enter 仍建新标签；受控 `value` 中不在 `treeData` 的路径无占位标签。
- Vue：`modelValue` 的原地修改检测不到，需替换整个数组。Svelte：绑定的 `value` 与 `keyMaps` 的原地修改检测不到，需替换整个对象。已知限制（宿主的 tracker 只比较引用；升级条件：框架提供不依赖引用比较的变更通知时在框架侧补检测）。
- Svelte：就地修改 `$state` 的 `treeData` 时每次都用 `$state.snapshot` 遍历整棵树比较，树很大时应替换整个 `treeData`；节点上放函数或 DOM 节点时 dev 下可能告警。已知限制（升级条件：出现大树性能问题时改用显式版本号或替换式更新）。

### TimePicker、TimeInput、Combobox

- 保持原样：`invalid` 恒 false；`onBlur` 只在点击外部关闭时触发。
- 自定义触发器内有没有可聚焦元素，只在触发器挂载时（React、Solid 另在换新 `triggerRender` 时）测量，之后内容增删可聚焦元素，包裹 div 的 button 语义不跟着切换。已知限制（升级条件：需要动态切换时，用 MutationObserver 监听触发器子树后重新测量）。

### Select、Option、OptGroup

- `allowCreate` 不支持异步创建；读屏虚拟光标激活触发器内控件不开合弹层；`virtualize` 时回落的高亮可能在渲染窗口外。已知限制。
- `ellipsisTrigger` 加 `expandRestTagsOnClick` 时，展开期间选项变化、收起后恰好放得下，`+N` 偏多（OverflowList 只在溢出变化时回调）。已知限制（升级条件：OverflowList 每个实例首次必报，需核对其他使用方）。
- 不做：未选值时 placeholder 成为 select-only combobox 的 AX value（2026-10-11，与 React Aria、Radix 一致）。
- 保持原样：分组标题使 `:nth-child` 偏移；自定义创建项不可聚焦；重开下拉保留上次高亮；`prefix` 与 `insetLabelId` 同传时 prefix 不作名称来源。
- `options`（AutoComplete 为 `data`）被原地修改的检测在框架侧，宿主的 tracker 只比较引用。已知限制（升级条件：框架提供不依赖引用比较的变更通知时并入宿主；AutoComplete 相同）。
- `defaultOpen` 的 Select 服务端 HTML 中触发器 `aria-expanded="false"`，挂载后才打开。已知限制（升级条件：弹层进入服务端 HTML 时一并处理，TreeSelect、AutoComplete 相同）。
- Svelte：`optionList` 里属于同一分组的条目必须相邻，不相邻的同 `key` 条目渲染成两个分组；虚拟列表下不显示分组标题。已知限制。
- Svelte：`prefix`、`suffix` 的 text 或 icon 类名挂载后才补上，服务端 HTML 缺这两个类（同 Input）。已知限制。

### TreeSelect

- 保持原样：`prevProps` 存放在 foundation state（见 Tree）。
- 窗口失焦（`relatedTarget` 为 null）时下拉保持打开，只有 Tab 到外部可聚焦元素或点击外部才关闭。已知限制。
- 保持原样：`isRenderInTag: false` 时无 key 告警；点击标签后移除焦点落 body。
- `defaultOpen` 的 TreeSelect 挂载后才打开，服务端 HTML 中触发器 `aria-expanded="false"`。已知限制（见 Select）。
- Svelte：不绑定也不传 `value` 的 TreeSelect、Tree 放在展开 props（`{...props}`）的包装组件里时，父级 props 变化会把 `value` 重置为 `undefined`，选中项被清空：这是 Svelte 5 对展开 props 的行为（https://github.com/sveltejs/svelte/issues/15379），组件内无法区分父级清空与展开重置；包装组件把 `value` 单独解构后传入或使用 `bind:value` 即可避免。已知限制（升级条件：Svelte 在展开 props 时保留未传入的 bindable 本地值）。
- Svelte：`expandedKeys`、`loadedKeys` 被组件写出后再被父级改回 `undefined`，不会同步清空。已知限制。

### DatePicker、DateInput、MonthsGrid、Month、Navigation、YearAndMonth、QuickControl

- 设置 `timeZone` 后，系统时区夏令时跳过的时刻在面板时间列表里选不到（选 02 时变成 03:30，值为 02:30 时列表高亮 03），只能输入；这类时刻与一小时后的时刻 `getTime` 相同，`disabledDate` 判定与多值去重按同一时刻处理。已知限制（升级条件：时间列表改为按 `timeZone` 取值）。
- 保持原样：autoSwitchDate 对范围无效；`onFocus` 打开面板的页面键盘选择或 Esc 后会重新打开；左面板键盘移出本月时焦点不跨到右面板。
- Svelte：自定义 `trigger` 内是否有焦点目标只在挂载时测量一次（同 TimePicker）。已知限制。
- Svelte：没有 KeepAlive，停用时关闭面板的行为没有移植。已知限制。
- 保持原样：实例方法 `open()`、`close()` 不调用 `onOpenChange`，只有用户操作开合面板时通知（各框架与原 Semi 一致；Svelte 另写回可绑定的 `open`）。
- 保持原样：Svelte 自定义 trigger 的 `inputValue` 在合法日期提交后变回 null（写回 `value` 触发 `syncFoundation` 重置）；合法输入重新格式化后与键入文本逐字相同，显示不受影响，其他框架受控回写时同样清空。键入 `2021-6-1` 这类非补零文本不会被改写。

### Form、ArrayField、withField、FormLabel、FormErrorMessage、FormSection、FormSlot、FormInputGroup、SchemaField、SchemaForm

- React：表单状态每次变化都重渲染全部字段（字段读 `useFormState()`，`FieldBridgeContext` 每次渲染都是新对象），只影响大表单 validate、submit、reset 时的性能。已知限制（升级条件：出现可测量的性能问题时，InjectedField 改为从实例或 ref 读初值并去掉 `useFormState()`，fieldBridge 用 ref 读最新 props 保持稳定）。
- `onSubmitFail` 的 `errors` 类型为错误树，Form `validator` 抛出或返回非对象时收到的是原值，类型覆盖不到。已知限制。
- 以 keepState 卸载的 ArrayField 重新挂载后，`reset()` 恢复的是最初的 `initValue`，不是卸载前最后一次挂载时的 `initValue`。已知限制（升级条件：有使用方需要按再挂载时的 `initValue` 重置）。
- 字段无初值时 `onChange` 抛错后子组件仍显示被拒绝输入（需回滚设 `initValue`）；`reset(fields)` 作废进行中的校验时 submit 以未校验初值调用 `onSubmit`。已知限制。
- 保持原样：挂载 Field 不触发 `onChange`；`CommonexcludeType` 命名。
- ArrayField 的 `keepState` 为 false 时，卸载或改 `field` 会删除旧路径的值、错误与 touched，旧路径已被另一个 ArrayField 的行占用时（行移动后出现）也一并删除；四个框架的卸载与改名都有这个限制，现有用例未覆盖该场景。已知限制（升级条件：有使用方遇到时，在 foundation 的 `#unRegisterArrayField` 中跳过已被其他 ArrayField 注册的路径）。
- `form-api-proxy` 的 `bind`、`unbind` 仍在框架层：放进 foundation 的 `init`、`destroy` 会绑定未包装的 formApi，丢掉 Solid 的 `batchMethods`、Svelte 的 `untrackMethods` 包装；这两处包装 formApi 的全部函数成员，没有可共享的方法名单。已知限制（升级条件：包装改为按名单或由 foundation 提供包装钩子时，`bind`、`unbind` 收进 foundation）。
- Svelte：用 `setValue` 删除 keyed 数组中间行时，Svelte 先注销被移除行的字段（删掉其值），再创建接管该路径的新字段；Vue 的 Debug-SetValuesDemo 场景无法复现，用例已移除。已知限制。
- Svelte：Form 设置 `labelCol`、`wrapperCol` 时，InputGroup 的标签落在 wrapper 列而不在 label 列。已知限制（升级条件：InputGroup 能由外部标签命名时改）。
- `schema` 只保证 Zod：Form 用例和 demo 只用 Zod；Valibot、ArkType、yup 只核对了错误路径格式（`{ key }` 对象段、字符串下标、函数形式的 schema），都能由 `toPath` 归一化后匹配字段，未跑用例。保持原样（维护者决定当前只支持 Zod）。

### AIChatInput、Configure

- 浏览器用例「方向键移到长列表末项时面板滚动」在全量 coverage 中失败过一次。UNKNOWN（失败时记录面板 `clientHeight`、`scrollHeight`）。
- Chrome on macOS 从 Finder 复制文件后粘贴，剪贴板是否同时带文件名和文件未验证。UNKNOWN（影响：只插入文件名不上传，需维护者知情）。
- 保持原样：inputSlot 空槽 placeholder 宽度晚一帧；Configure 的 `value`、`field` 只在挂载时读；`skillHotKey` 无默认值。
- Solid：父组件在挂载期间（渲染中或 `onMount`）把 `generating` 设为 true 时不清空内容与附件（React 会清空），编辑器要到 RichTextInput 的 `onMount` 才创建。已知限制（升级条件：清空请求在编辑器就绪前排队，`onCreate` 后执行）。
- 保持原样：四个框架各自调用 `setOptions` 同步编辑器的 `editorProps`，载荷由 foundation 的 `createEditorProps` 生成，调用时机由各框架的响应式驱动（与 tiptap 官方包一致：只有 `@tiptap/react` 在 options 变化后调 `setOptions`，Vue、Solid、Svelte 的包都交给使用方）。
- Solid：编辑器在 RichTextInput 的 `onMount` 中创建，服务端 HTML 的 `semi-aiChatInput-editor-content` 是空容器，没有 ProseMirror 子树与 placeholder，挂载后才插入。hydration 用例只校验无报错，不比较挂载前后的结构。已知限制（升级条件：需要首帧显示 placeholder 时，服务端输出与编辑器结构一致的静态占位，并让用例的 `mountDiff` 收窄为属性列表）。

### Sidebar、Container、Annotation、MCPConfigure

- 保持原样：无 `url` 的 Annotation 条目不可聚焦；文件编辑器 MenuBar 非 `role="toolbar"`；Sidebar 忽略 `containerRef`、`renderHeader`、`children`。
- Solid：父组件在 `onMount` 中切换 `mode` 时不移动焦点（React 在焦点位于 body 时移到返回按钮），首轮 effect 时新视图尚未渲染。已知限制（升级条件：需要挂载期切换也转移焦点时，把焦点修复移到视图更新之后）。
- Svelte：无 `url` 的 Annotation 条目是没有 href 的 `<a>`，不可聚焦。保持原样（同 React）。

### AIChatDialogue、Dialogue、DialogueAction

- 保持原样：组件自己写回 chats（点赞、点踩、删除、提示点击）时 `onChatsChange` 只报一次，原来是两次（foundation 统一按值判断列表是否变化，两次上报无法保留；依赖第二次回调的使用方少收一次）；`resetMessage` 忽略传入 message；`continueSend` 写死 false；Action 的 className、role、messageEditRender 不消费；文件卡片引用图标冒泡。

### Chat

- 保持原样：markdown 异步编译使跟随底部落后一块；定时器卸载不清理；`resetMessage` 在空列表造 loading 消息；`uploadProps.renderFileItem` 被丢弃。
- Solid：`uploadTipProps` 与自定义 `uploadProps.children` 同用时，Tooltip 用 span 包住自定义节点；节点内有可聚焦元素时 span 退出 Tab 顺序并给出 warning，`aria-describedby` 落不到该元素上（AIChatInput 相同）。已知限制（升级条件：Upload 的 `children` 接受 `(getTriggerProps) => JSX.Element` 后，把提示属性展开到自定义触发器上）。

### Calendar

- 时间槽与日期格的点击没有键盘方式。保持原样（每格加 button 会多出 42 或 336 个 Tab 停靠点；升级条件：需要时视图改为 ARIA grid 加 `aria-activedescendant`，复用 DatePicker 的网格模式）。
- Solid：月视图首帧显示全部事件，测量行高后才折叠为「N 更多」，服务端 HTML 是未折叠的。已知限制（升级条件：行高可在服务端预知时，按行高推算初值）。
- Solid：周视图与日视图在挂载后才知道哪一列是今天，该列随之重建以启动当前时间线，hydration 后的 DOM 结构与服务端不同；今天标记（`aria-current`、`-today`）与时间线只在挂载后出现，是为了服务端与浏览器处于不同日期时不错位。已知限制（升级条件：需要首帧即带时间线时，服务端按请求时间输出且客户端读同一时间）。

### InputNumber

- 保持原样：`pressInterval` 默认 250ms；小写 `autofocus` 落 DOM；挂载后 `localeCode`、`currency` 变化不重新格式化。

### Upload、FileCard

- FileCard 的 Props 经 `BaseFileItem` 带上内部标志 `_sizeInvalid`。已知限制（受控 `fileList` 会把条目原样传回，标志要随条目往返；升级条件：foundation 改为按 uid 内部记录体积不合法后，从公开类型中去掉）。
- Vue：添加区是否已含可聚焦控件要挂载后才判定，服务端 HTML 中触发区带 `role="button"`、`tabindex="0"` 并包着内部按钮（嵌套交互元素），挂载后才去掉。已知限制（升级条件：需要 hydration 前无嵌套交互元素时，首帧按 `children` 是否为元素判断）。
- Solid：只有 Semi 的 Button、IconButton 与 AIChatInput 的默认上传按钮在组件体内向添加区登记，首帧即判定；原生 `button`、`a[href]` 等其他可聚焦控件仍在挂载后由 MutationObserver 判定，服务端 HTML 中触发区同样带 `role="button"`、`tabindex="0"` 并包着该控件。已知限制（升级条件：需要其他 Semi 控件首帧即判定时，在其组件体内调用 `upload/context.ts` 的 `useAddAreaControl`）。
- 保持原样：React、Solid 的 `timeout` 与 React 的 `FileCardProps.className` 未使用。
- Svelte：上传区域的 `role="button"` 在首帧（含服务端）靠挂载后的 MutationObserver 判断内部是否含 Semi 控件，首帧可能多一个按钮语义。已知限制（升级条件：Semi 控件初始化时向上传区域登记，Solid 的做法）。
- Svelte：没有接入 Tooltip 的特殊触发器协议，外包 Tooltip 时 `tabindex` 落在上传区域。已知限制。
- Vue：每个进度事件都让全部 FileCard 重渲染（列表经 `SlotFragment` 的插槽渲染，插槽里的 `v-memo` 在服务端渲染时引用不存在的 `_cache` 而报错）。已知限制（升级条件：文件列表不再经 `SlotFragment` 插槽渲染，或 Vue 修复插槽内 `v-memo` 的服务端编译后，加回按文件的 `v-memo`）。
- FormUpload 必填时，添加区自带可聚焦控件的情况下必填说明挂在根元素的 `aria-describedby` 上，根元素不是焦点目标，读屏聚焦使用方的控件时读不到。已知限制（升级条件：Upload 把必填说明的 id 交给使用方的控件）。
- 卸载时不 revoke 裁剪预览的 blob URL（`destroy()` 分不清卸载与隐藏，受控的父组件也可能还持有这些 URL；Vue 原来在失活时取消裁剪并 revoke）。已知限制（升级条件：宿主能区分卸载与隐藏时，卸载分支 revoke）。

### Transfer

- 保持原样：`draggable` 时忽略 `virtualize`。
- blur 按 `focusout` 的 `relatedTarget` 是否在根元素内判断：点击 Transfer 内不可聚焦的区域时焦点落到 body，也会触发一次 blur（窗口失焦同样触发，与 TreeSelect 一致）。已知限制（升级条件：需要区分时在根元素上记录内部 mousedown，跳过随后的那次 focusout）。

## 2 已知未处理的类型与工具链问题

- 保持原样：Sidebar 文件编辑器用例的 `fireEvent.keyDown` 带 `keyCode`，prosemirror-keymap 在带修饰键时按 `keyCode` 回退查找。
- Svelte：`drag-move/drag-move.ts` 的 `options` 在 attachment 闭包内解构，移到形参会提前读取、改变响应式追踪。保持原样。
- Vue、Svelte 的公开 Props 类型仍含内部属性：TextArea 的 `disabledEnterStartNewLine`，Input 的 `showClearIgnoreDisabled`，OverflowList 的 `overflowRenderDirection`，FormErrorMessage 的 `errorMessageId`、`helpTextId`、`isInInputGroup`，Vue 另有 Breadcrumb.Item 的 `active`、`shouldRenderSeparator`、`route`；生成的 API 表如实列出并注明内部用途（React、Solid 已拆出 `XxxInternalProps`）。已知限制（升级条件：框架提供不进公开类型的内部 prop 机制，或这些属性改由 context 传入）。
- 保持原样：React TabItem 的 `selected`、`deleteTabItem`、`handleKeyDown` 留在公开类型，demo 的拖拽排序由使用方传入 `selected`，`deleteTabItem`、`handleKeyDown` 在文档中作为自定义 TabItem 时可覆盖的属性。
- React：`hydrateFromServer` 渲染服务端 HTML 时只移走 `document`，`window` 与其他 jsdom 全局仍在，按 `typeof window` 分支的依赖在服务端与客户端都走浏览器分支，由此造成的 hydration 不一致在 `hydration.test.tsx` 中发现不了。UNKNOWN（影响：这类不一致只由 check-pages 的 SSR 验收覆盖）。解决条件：hydration 用例改为读取 `react-ssr` 项目在 Node 中产出的 HTML。
- React API 表生成器只读组件传给 `useDefaultProps` 的默认值、参数解构的默认值与模块的 `defaultProps`；调用 `useDefaultProps` 之后在函数体内解构的默认值、写在内部渲染组件里的默认值读不到，默认值列显示 `-`，由说明写出实际默认值（Button、Grid、Breadcrumb.Item、CardGroup、Highlight、ColorPicker、Steps、Skeleton、Navigation、Sidebar 等）。已知限制（升级条件：把这些默认值移入组件的默认值对象，或让生成器读取函数体解构，并删去说明里重复的默认值）。
- `vp pack` 的 d.ts 打包丢失经组件模块再导出的类型（semi-ai-react、semi-ai-vue）。已知限制（升级条件：打包工具修复）。
- Chat、AIChatDialogue：`escapeHtmlInMarkdown` 不识别 4 空格缩进代码块。已知限制（升级条件：改为 remark 插件）。
- Solid：SolidStart 2.1.0（solid-js 1.9.17、@solidjs/router 1.0.0、nitro 3.0.260903-beta、vite 8.3.5）中，root 用 `ErrorBoundary` 包 `Suspense` 时，模块导入阶段就抛错的路由（顶层 `throw`）在 dev 与 prod 下都返回 200 且响应流永不结束，只收到约 1.2 KB 的 shell，服务端日志无该错误，页面请求挂起而不是显示错误边界；渲染时抛错的路由能正常结束并输出 fallback。不含 Semi 的最小复现（只依赖上述五个包）证实与 Semi 无关；症状同 https://github.com/solidjs/solid-start/issues/2260（该问题已随 solid-js 1.9.15 的 lazy 拒绝修复关闭，导入期抛错仍复现）。已知限制（上游问题；升级条件：上游修复后升级 `@solidjs/start` 并删去本条）。
- 浏览器测试输出 `ResizeObserver loop completed with undelivered notifications`：Vue、Solid 的 Select，Vue、Solid、Svelte 的 OverflowList，Solid 的 TextArea autosize 回退，semi-ai-react 的 AIChatInput。保持原样（观察回调改变了布局时浏览器按规范把剩余通知推迟到下一帧并报告此错误，通知不丢、结果不变；不屏蔽，出现在别的组件或伴随断言失败时再排查）。
- Vue：渲染函数用新对象把插槽转交给子组件（`{ ...slots }`）时，使用方在 SFC 模板顶层写的条件插槽（`<template v-if #x>`）在服务端渲染中丢失输出（`createSlots` 产出的插槽不带已规范化标记，被子组件再次规范化后，直接写进 SSR 缓冲区的内容被丢弃；上游 issue https://github.com/vuejs/core/issues/16159 ，修复 PR https://github.com/vuejs/core/pull/16160 ）。withField、AIChatDialogue、Chat 经 `packages/semi-ui-vue/src/utils/hand-on.ts` 只带 props 调用转交的插槽，条件插槽的服务端 HTML 与静态写法一致。ModalContent、Feedback、AIChatInput 仍用 `{ ...slots }`，实测不受影响：Modal、Feedback 的内容在 Portal 里，挂载前不渲染；AIChatInput 的 UploadButton 在渲染函数里直接调用 `uploadButton` 插槽，`uploadTip` 在 Tooltip 弹层里，UploadButton 改用模板 `<slot>` 渲染服务端可见的插槽时要改用 `handOnSlots`。已知限制（升级条件：上游修复发布后升级 Vue，删除 `hand-on.ts`，各处恢复直接转交）。
- 工具链 `@vue/language-core` 3.3.12 起 URL 属性在作用域插槽内报 TS6133、TS2304。已知限制（升级条件：上游修复 https://github.com/vuejs/language-tools/pull/6241 发布后升级 vue-tsc）。

## 3 主题与站点

- Table 页「固定表头」一节的示意图只有 React 实现，只在 React 页显示，Vue、Solid、Svelte 页没有示意图。已知限制（升级条件：各框架各写一份示意）。
- 保持原样：主题 token 对比度低于 4.5:1（2026-10-13 决定不调整）。2026-10-25 评估过 DSM 的 `@semi-bot/semi-theme-a11y` 色板：React 中文页的 color-contrast 问题从 73 个 demo 增至 237 个（其 blue-5 `#1273ea` 在 Button light 的 `#f5f5f5` 填充上只有 4.12:1），warning 与黄色系仍不达标，不采用。
