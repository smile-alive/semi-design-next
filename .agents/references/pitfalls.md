# 跨框架的坑

不知道就会写错、而且各规则文件里没有写的事实。每条依次是现象、原因、做法。写法规则不收在这里；已有文档写过的坑只留一句话和链接。

## 提交时机

- **Solid 在点击里同步卸载弹层，外层 `onClick` 收不到。** Solid 的状态写入立即提交，弹层在关闭它的那个事件冒泡完之前就被卸载，Solid 的委托事件到不了外层。弹层离场后的收尾不要和关闭同一轮执行：Tooltip 在 Solid 里用 `foundation.syncPopup(Promise.resolve())` 晚一个微任务再读离场动画（`semi-ui-solid/src/components/tooltip/tooltip.tsx`）。
- **foundation 自己挂的 window 监听不经过 Solid `useFoundation` 的 batch 代理。** 监听回调里的多次状态更新逐次提交，不在同一批。需要「回调先于 DOM 更新」时，让 foundation 经 adapter 的 `batch(fn)` 执行回调（Tooltip 的点击外部监听，`tooltip/foundation.ts` 的 `#watchClickOutside`）。定时器、请求回调同理，见 [Solid components](solid/components.md) 的 foundation 一节。
- **Svelte 读离场动画前要先 `tick()`。** 阶段刚变时模板还没把 show 的 class 换掉，立刻读读不到新动画。把 `tick()` 作为 `syncPopup` 的 `beforeRead` 传入（`semi-ui-svelte/src/components/tooltip/tooltip.svelte`）。
- **`hide()` 可能先于「已打开」的上报。** 各框架提交快慢不同，Solid 在 `show()` 里同步渲染，其他框架更晚，依赖「open 定时器先于关闭」的回调顺序会在某个框架上反过来。Tooltip 的 `hide()` 在上报 `false` 前，若还没上报过 `true` 就补报一次，保证 `onVisibleChange` 成对（`tooltip/foundation.ts` 的 `hide`）。新增对「先开后关」有顺序假设的回调时照此补齐。
- **React 提交后会把焦点移回 keepDOM 里的旧元素。** Modal 关闭后 React 在 mutation 阶段清理之后重新聚焦先前聚焦的元素，盖掉 foundation 刚归还的焦点。关闭后要在 layout 阶段再还一次（`ModalContentFoundation.restoreFocus`，React 在 `hooks/use-overlay-resources.ts` 里调用）。

## 属性合并

- **Vue、Svelte 里显式传 `undefined` 会盖掉生成的 `aria-*`。** 生成属性写在前、展开调用方属性写在后时，展开的 `undefined` 把生成值覆盖掉；React、Solid 用 `??` 取值，不受影响。需要「`undefined` 等于没传」的落点，写成 `调用方值 ?? 生成值`，并把显式绑定放在展开之后。
- **Vue 的默认 fallthrough 在根元素自身绑定之后合并。** 根上写了 `:aria-label="生成值"`，调用方传 `aria-label={undefined}` 仍会把它擦掉。这类根元素设 `inheritAttrs: false`，手写 `v-bind="$attrs"` 再写显式绑定（`semi-ui-vue/src/components/breadcrumb/breadcrumb.vue`）。传给子组件做 fallthrough 的属性对象先剔除 nil 值（`modal-content.vue` 的 `dialogAttrs`），Svelte 同理（`semi-ui-svelte/src/components/modal/modal-content.svelte`）。
- **多数组件根元素有意让调用方覆盖生成的 `role`、`aria-*`。** 四个框架一致，这是既定行为（F2），不要为了对齐上面的写法把它们改成 `??`。

## ARIA 与焦点

- **`aria-controls` 只在被引用的元素存在时才写。** 面板没渲染时写了就是悬空引用。Select、AutoComplete、DatePicker、TimePicker 只在打开时写；Cascader、TreeSelect 关闭时仍渲染占位元素，所以一直写。新增组合控件先看面板关闭时 DOM 里有没有这个 id。
- **自管下拉用 `Popover trigger="custom"` 时要传 `disableArrowKeyDown`。** 否则 Tooltip 的触发器按键处理会在 ArrowUp、ArrowDown 时把焦点送进弹层里第一个可聚焦元素，也就是 slot 里的输入框或下拉内的搜索框（`tooltip/foundation.ts` 的 `#handleTriggerKeydown`）。React 有时因为 keydown 的处理顺序碰巧没事，不能依赖。
- **弹层自己处理 Escape 并 `close()`，不经过 Tooltip 的 Escape 路径。** 焦点在弹层内（slot 里的输入框）时，弹层随 `close()` 一起隐藏，焦点掉到 body。要自己把焦点还给触发器（`cascader/foundation.ts` 的 `handleKeyDown`）。
- **遮罩与对话框是兄弟节点时，不需要防拖拽误关。** 在对话框内按下、在遮罩上松开，click 落在两者的共同祖先上，遮罩收不到。遮罩包住对话框的结构（Modal 的 wrap）才需要这层保护。SideSheet 是前者，Modal 是后者；对应用例见 `vitest/specs/side-sheet.ts`「在对话框内按下、在遮罩上松开不关闭」。
- **触发器的按键处理放行 Ctrl、Meta，不要把 Alt 一起放行。** Ctrl、Meta 组合键属于浏览器和系统，直接 `return`。Alt+ArrowDown、Alt+ArrowUp 是 APG combobox 的开合键，要照常处理，其余 Alt 组合才放行（`tree-select/foundation.ts` 的 `handleSelectionKeyDown`）。面板内的列表（`date-picker/month-foundation.ts`、`scroll-list/item-foundation.ts`）没有开合语义，三种修饰键都放行。
- **虚拟列表下 `aria-activedescendant` 可能指向没渲染的行。** 已登记为已知限制，见 [decisions](../../docs/decisions.md) 的 Tree 一节；新增虚拟化组合控件时不要假定当前行一定在渲染窗口内。

## 测试环境

- **jsdom 里按键同步卸载当前焦点元素，焦点会落到 body。** user-event 丢掉 Tab 的起点，Vue、Svelte 表现为焦点掉到 body，真实浏览器没有这个问题。这类行为放浏览器测试，见 [testing](testing.md#什么进-spec)。
- **jsdom 不执行 `input[type=range]` 的按键默认行为。** 原生的方向键、Home、End 都不改值。Slider 里只有组件自己处理的键能在单测里移动手柄，其余键位的检查放浏览器测试。
- **`Date` 被冻结，typeahead 的搜索串永不超时。** 测试里连续输入的字符会一直累加成同一个搜索串。两条互不相干的 typeahead 断言各自独立渲染；同一条用例里要连续输入时，按累加后的搜索串写预期（`vitest/specs/select.ts` 的 typeahead 用例）。
- **React 在假定时器推进后需要 `act` 刷新。** 共享 spec 用 `getConfig().eventWrapper(() => vi.advanceTimersByTime(ms))` 包一层，其他框架里它是空操作（`vitest/specs/input-number.ts`）。
- **右键、双击用 `userEvent`，不用 `fireEvent`。** 共享 spec 里写 `userEvent.pointer({ keys: '[MouseRight]', target })` 和 `userEvent.dblClick(el)`（`vitest/specs/tree.ts`）。
- **`fails` 只标真实的框架行为漂移。** 测试环境的假象（jsdom 缺能力、冻结的时钟）不用它，改成浏览器测试或换写法。写法见 [testing](testing.md#已知失败)。
- **别断言监听的实现细节。** 「全局监听带不带 signal」「window 上有几个监听」会被别的组件新增的监听打破。断言可见结果：未打开时不注册、卸载后移除，用 `countLiveListeners`（见 [testing](testing.md#共同约定)）。
- **Svelte 浏览器 tsconfig 会收录 spec 夹具。** 夹具不以 `-spec-fixture.svelte` 命名就不会被排除，spec 被套上浏览器 matcher 类型而报错。见 [testing](testing.md#位置与协议)。
- **临时复现用例要放进包的 `__tests__/`。** vitest 的 include 只收 `packages/` 下的 `__tests__`（`vitest/framework.ts` 的 `filesOfKind`），放在 `tmp/` 下不会被收集。用完用 `trash` 删除。
- **测试通过但 `typecheck` 报 adapter 方法或导出不存在。** vitest 经 `vite.semi.ts` 的 `semiSourceAliases` 把 Semi 包都映射到 `src`，改完 foundation 不用构建就能跑测试；类型检查读的是 foundation 的 `dist`。foundation 有改动时先 `pnpm build` 再 `pnpm typecheck`，见 [AGENTS.md](../../AGENTS.md#验证)「类型」一行。
- **`node scripts/typecheck.ts` 直接跑会报 `spawn tsc ENOENT`。** 脚本按名字启动 `tsc`，依赖 `node_modules/.bin` 在 `PATH` 里。用 `pnpm typecheck` 或 `pnpm exec node scripts/typecheck.ts`。
- **带覆盖率的长跑里浏览器项目报 `Browser connection was closed`。** Chromium 不回收已跑完文件的 iframe 文档，插桩后累积几十个文件就会断开页面的 WebSocket，断点随机，该项目剩余文件不再执行。`test:coverage` 用 `VITEST_CHROMIUM_GC_FORCE=1` 与 `VITEST_CHROMIUM_GC_DISK_THRESHOLD_GB` 让 vitest 在每个文件后回收（默认只在 Linux 磁盘不足时回收）；vitest 修复 [#11702](https://github.com/vitest-dev/vitest/issues/11702) 后可删。

## 构建与体积

- **模块顶层的高阶组件调用要标 `/* @__PURE__ */`。** 没有标注时打包器不敢摇掉，单独导入一个 Form 字段会带上全部字段。`semi-ui-react/src/components/form/field.tsx` 里每个 `withField(...)`、`withTopLabelField(...)`、`Object.assign(...)` 都带标注，`pnpm size` 守着这件事。
- **别从组件的静态属性取子组件。** `Select.Option` 这样的访问会把整个父组件拖进依赖图。包内部直接导入子组件文件（`import Option from '../select/option'`）。
