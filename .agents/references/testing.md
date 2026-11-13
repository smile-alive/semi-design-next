# 测试与验证

测试由 Vitest（`vp test`）运行，配置在根目录 `vite.config.ts` 的 `test.projects`。命令表见 `AGENTS.md`「验证」。

## 位置与项目

- 测试放在所属目录的 `__tests__/` 下，用 `.ts`，含 JSX 的用 `.tsx`。测试由所属项目的 tsconfig 做类型检查（框架无关的测试用 `vitest/tsconfig.json`，各框架用 `vitest/<框架>/` 下的 tsconfig），随 `pnpm typecheck` 运行。
- 类型写法：DOM 查询用 API 自带的泛型（`querySelector<HTMLInputElement>(...)`）或 `as HTMLElement`；`vi.fn` 写类型参数（lint 规则 `vitest/require-mock-type-parameters`），传给 prop 时用 prop 类型（`vi.fn<NonNullable<SelectProps['onChange']>>()`），adapter 方法用 `XxxAdapter['method']`；只给部分字段的 adapter、props 用 `as unknown as XxxAdapter`，同一文件多处时提取带类型的工厂函数；故意传入不合法值、或断言某种写法应被类型拒绝时，用 `@ts-expect-error` 并在同一行写明原因。不用 `any`、`@ts-ignore`。
- `common` 项目在 jsdom 中运行 foundation、图标、动画与构建工具的 `__tests__`（`*.ssr.test.*` 除外，见「服务端渲染」），各框架项目运行各框架包的 `__tests__`，样式导入被替换成空模块。Testing Library 只在 `afterEach` 是全局函数时自动注册 cleanup，各框架的 cleanup 由 `vitest/<框架>/<框架>.setup.ts` 注册，框架项目与对应的浏览器项目都加载。与框架无关的全局 setup（`vitest/setup.ts`）：
    - 时区固定为 Asia/Shanghai；
    - `Date` 冻结在 2019-08-08 12:00:00，计时器保持真实；需要时钟走动的用例自己调用 `vi.useRealTimers()`；
    - `Math.random` 换成固定种子的伪随机；
    - `ResizeObserver`、`IntersectionObserver` 是空实现；需要上报尺寸的用例用 `@test/utils/<框架>` 的 `mockResizeObserver`，需要媒体查询结果的用 `mockMatchMedia`，不在测试文件里各写一份；
    - jsdom 没有布局，setup 伪造了几何接口：`getBoundingClientRect` 和 `offsetWidth`、`offsetHeight`、`offsetTop`、`offsetLeft` 只读元素内联的 `style.width`、`style.height`、`style.marginLeft`、`style.marginTop`（缺省为 0），`Range` 的矩形恒为空，`checkVisibility` 恒为 true，`scrollIntoView` 是空函数，`matchMedia` 按 `innerWidth` 计算 `min-width`、`max-width` 查询，`document.documentElement` 的 `clientWidth`、`clientHeight` 等于 `innerWidth`、`innerHeight`（没有滚动条，需要滚动条宽度时在用例内 spy），`getClientRects` 返回 `[getBoundingClientRect()]`。弹层按视口夹紧，触发器在 0,0 时断言位置会被夹回视口，用例内 spy `getBoundingClientRect` 把触发器移开。依赖真实尺寸、截断或可见性的断言放到浏览器测试；单元测试要让某个元素「有尺寸」时，给它设内联样式或 spy 对应属性；
    - 配置开启 `restoreMocks` 与 `unstubGlobals`，每个用例结束后自动还原 `vi.spyOn` 和 `vi.stubGlobal`，不必再写 `vi.restoreAllMocks()`、`vi.unstubAllGlobals()`（用例内途中需要还原时除外）。
- 测试项目命名：`common`、`common-browser`、`common-ssr`，以及每个框架的 `<框架>`、`<框架>-browser`、`<框架>-ssr`。浏览器项目名必须以 `-browser` 结尾，`pnpm test` 与 `pnpm test:browser` 才能正确分流。框架的 setup 与测试 tsconfig 放在 `vitest/<框架>/`，项目由 `vitest/index.ts` 汇总，框架项目的写法见各框架目录的 `testing.md`。
- 浏览器项目在 Playwright Chromium 中运行 `*.browser.test.ts` 与 `*.browser.test.tsx`，加载带主题的 SCSS，视口 1000×660。只有需要真实布局、样式、焦点或指针事件时才写浏览器测试。测试最多 2 个 worker，浏览器项目禁止文件并行，同一时间只启动一个 Chromium。
- 每个框架另有 `<框架>-firefox-browser` 与 `<框架>-webkit-browser`，在 Playwright Firefox 与 WebKit 中运行有兼容写法的组件（D15，列表为 `vitest/framework.ts` 的 `compatComponents`）的浏览器测试；兼容路径在这两个浏览器上是主路径，改动这些组件或它们的兼容写法时三个浏览器都要跑。只在 Chromium 成立的用例（CDP、`gc()`、Chrome 无障碍树）用 `@test/utils/browser` 的 `isChromium`（读 `vite-plus/test/browser` 的 `server.browser`）写成 `it.skipIf(!isChromium)(...)`（参数化用例写 `it.skipIf(!isChromium).each(...)`）；只有 WebKit 不具备的平台行为（点击非文本控件不聚焦）用 `isWebKit` 写成 `it.skipIf(isWebKit)(...)`，与平台无关的断言拆到另一条用例里照常运行；两种都在用例上方用一行注释写明原因，不在断言里按 `server.browser` 分支预期值。Playwright 自带的是最新版 Firefox 与 WebKit，目标下限版本（Firefox 125、Safari 17.2）缺失而最新版已有的能力，用 spy `CSS.supports` 或删除原型方法强制走兼容路径。
- 浏览器测试按受影响的组件选范围：单个组件目录，或共享被改代码的几个组件；只有所有浏览器项目的配置都变时才全量。
- 公共工具用别名导入：各框架的测试用 `@test/utils/<框架>`，浏览器测试的 `clickOutside` 来自 `@test/utils/browser`。框架无关的测试（foundation 等）直接导入不依赖框架的模块，如 `@test/utils/dom/resize-observer-core`；导入另一框架的入口由 lint 拦下。框架无关包里依赖某框架的测试放在 `__tests__/<框架>/`，文件名带 `<框架>.` 前缀（如 `semi-animation/__tests__/<框架>/<框架>.browser.test.ts`），由 `vitest/<框架>/index.ts` 的 `testFiles()` 按命名规则收入对应项目。

## 写法

### 共同约定

- 测试 API（`describe`、`it`、`expect`、`vi`、钩子等）从 `vite-plus/test` 显式导入，项目不开 `globals`。Testing Library 的自动 cleanup 依赖全局 `afterEach`，因此由各项目的 setup 显式注册 `afterEach(cleanup)`。
- `describe`、`it`、`test` 的标题和自定义失败信息用简体中文，描述被测行为；`describe` 可以只写被测符号（`Select`、`getDayofWeek`）。组件名、prop、按键、ARIA 属性等技术标识和 `%s`、`$name` 等占位保持原样，被测输入不为了标题语言改写。注释仍用英文。
- 断言可见行为：DOM、可访问名称与角色、回调的参数。不断言内部 state，不 spy foundation 的私有成员，也不读取源文件文本或 AST 来下断言。例外是覆盖守卫与编译产物：遍历包入口的导出、检查用例表或类型有无缺项的守卫可以读入口文件；验证编译器输出的用例（如 Vue 生产编译保留的 prop 运行时类型、主题与 tailwind 生成器）可以读它编译的源文件。源码写法约定（导入路径、文件首行声明）写进 `scripts/lint-*.ts`，不写成测试。
- 行为测试覆盖以下几类（已有用例覆盖的不重复写）：
    - 受控与非受控、默认值、`semiGlobal.config.overrideDefaultProps`；
    - 各 prop 产生的 class 与 DOM 结构、`x-semi-prop` 插槽；
    - 键盘与焦点、禁用态、事件回调的参数、`data-*` 等属性透传；
    - 定时器与动画（`vi.useFakeTimers`）；
    - 与 Tooltip、Form 等组件的组合；StrictMode 下的挂载与卸载清理。
- 修 bug 不新增回归用例。需要复现时写临时用例，验证后用 `trash` 删除；修复改变了已有用例断言的行为时，更新该用例。
- 已知缺口用 `it.fails`（它只要求用例失败，任何断言失败都算通过，不锁定具体的错误行为；断言写成预期的正确行为，修复后改成 `it`）或 `it.todo` 记录。不提交 `.only` 和 `.skip`，lint 会检查。
- 断言用 helper（如 `expectValues()`）时，函数名以 `expect` 开头，`vitest/expect-expect` 才能识别。
- jsdom 没有 pointer capture，`vitest/setup.ts` 把 `setPointerCapture` 等打成空函数。单元测试把浏览器会重定向到被按下元素的 `pointerMove`、`pointerUp` 直接发在该元素上，松开时再发 `lostPointerCapture`；用 spy 断言按下时捕获了正确的 `pointerId`。移出元素后仍跟随、在外面松开即结束，放到浏览器测试里用 `userEvent.dragAndDrop(源, 外部元素)` 加随后的 `userEvent.hover` 验证。
- jsdom 没有 canvas：`getContext` 返回 null。只关心尺寸或产物的用例在用例内 `vi.spyOn(HTMLCanvasElement.prototype, 'getContext')` 给一个空实现（必要时再 spy `toBlob`）；要断言绘制结果的放到浏览器测试。
- 假定时器伪造了 `setTimeout` 时不要 `await` user-event：Testing Library 每次调用后会等一个 `setTimeout(0)`，它只认得 jest 的假定时器，不会推进 Vitest 的，用例因此超时。这类用例用 `vi.useFakeTimers({ toFake: [...] })` 只伪造需要的计时器（如 `requestAnimationFrame`、`Date`），让 `setTimeout` 保持真实。
- jsdom 不运行 CSS 动画，`animationend` 不会触发。Tooltip 系弹层在定位完成（jsdom 中是 100ms 兜底计时器）后才启用动画，此后关闭要等 `animationend` 才卸载；用例在这之前还是之后关闭取决于机器快慢，负载高时就会一直等到超时。等弹层卸载的单元测试要么传 `motion={false}`，要么在等待时给带 `-animation-hide` class 的元素派发 `webkitAnimationEnd`（见 timePicker 测试的 `waitForClosed`）。
- 监听是否随卸载移除，用 `@test/utils/<框架>` 的 `countLiveListeners(add, remove, type)` 数存活的监听（已 abort 的 signal 算作移除），不断言 `removeEventListener` 的调用次数。

### APG 模式检查

`@test/utils/apg` 的 `checkPattern(pattern, root, options)` 按 WAI-ARIA APG 检查已渲染的控件：先查必需的角色、状态、id 引用、可访问名称和 Tab 停靠点，再从当前项出发按 APG 规定的键，断言焦点的去向。它补 axe 查不到的键盘交互；所有问题收集后抛一个 Error，每行写明元素（角色加名称或 id）和违反的规则。

- 模式：`tabs`、`menu`、`menubar`、`listbox`、`combobox`、`tree`、`radio-group`、`toolbar`、`dialog`、`alertdialog`、`disclosure`、`accordion`、`slider`、`switch`、`checkbox`。`root` 是承载模式的元素或它的容器，弹层渲染在别处时靠 `aria-controls` 找到；菜单、对话框要先打开再检查。
- `press` 由调用方注入，检查器自己不产生事件。键名是 `KeyboardEvent.key`（`ArrowDown`、`Home`、` `），唯一的组合键是 `Shift+Tab`。jsdom 里包 user-event 的 `keyboard`：`(key) => user.keyboard(key === 'Shift+Tab' ? '{Shift>}{Tab}{/Shift}' : key.length === 1 ? key : `{${key}}`)`；浏览器测试里同样包 `vite-plus/test/browser` 的 `userEvent.keyboard`。`press` 要等到控件重新渲染后再返回。
- 两种焦点模型都按 APG 判定合法：容器或输入框带 `aria-activedescendant` 时，当前项是它指向的元素，DOM 焦点不动（combobox、listbox、tree、grid）；否则当前项是 `document.activeElement`，同一时刻只有一个 `tabindex=0`（tabs、menu、toolbar、radio-group）。检查器读到哪种就按哪种判，不需要声明。
- APG 标为可选的行为不判违规：Home 与 End、循环、type-ahead 只在控件表现出该行为时检查一致性，`homeEnd: true`、`wraps`（`true` 必须循环、`false` 禁止、`'optional'` 都可以）、`typeahead: true` 把它们变成硬性要求或开启检查。tabs、menubar、radio-group 的循环 APG 没标可选，默认必须循环。`direction: 'rtl'` 翻转水平方向键。
- 检查会按 Enter、Space、Escape，可能切换值或关闭弹层（`actions: false` 只查结构与导航）；它还会移动焦点、高亮和选中项，结束时不恢复，每次调用都用新渲染的控件。
- 在共享 spec 里调用，让四个框架跑同一份检查：`press` 用 `vitest/specs/shared/press.ts` 导出的适配函数，布置（LTR、RTL、垂直、含禁用项）各写一条用例，参照 `vitest/specs/tabs.ts`。模式要求可访问名称时，名称通过夹具的 props 传入、走组件自己的落点，不在 spec 里直接改 DOM。检查器报出的是某个框架组件的真实问题时，不要放宽检查器，也不要改成通过：在该框架夹具的 `fails` 里写用例标题（断言保持预期的正确行为，修复后删掉条目），并在 `docs/decisions.md` 对应组件小节登记。

## 浏览器测试的坑

- 每个用例开始前，`vitest/browser.setup.ts` 会把真实指针移到右下角：上一个用例留下的悬停会让 Chromium 给新渲染的元素发 mouseenter，暂停自动播放或打开 hover 弹层。
- 点击组件外部用 `clickOutside()`，不点 `document.body`：Vitest 会按 body 的整段文本定位，内容一变就找不到。
- 在 Semi 弹层里输入不用 `userEvent.type`：弹层 id 可能以数字开头，生成的选择器不合法。先点击，再用 `userEvent.keyboard`。
- 等真实条件（元素出现、portal 移除），不用固定时长的 sleep。插桩覆盖率运行更慢，固定时长的等待会偶发超时。例外：断言某事不会发生时只能等固定时长，写明时长依据；其余等真实条件。
- 浏览器测试由 `vitest/tsconfig.browser.json` 或 `vitest/<框架>/` 下的 browser tsconfig 做类型检查，matcher 类型来自 `@vitest/browser`：`toHaveTextContent` 只接受字符串且整段相等，部分匹配或正则用 `toMatchTextContent`。
- 不在 `waitFor` 里写 `toHaveStyle`：内置的 `toHaveStyle` 每次调用都往 body 追加一个探测元素，这次 DOM 变动又触发 `waitFor` 的 MutationObserver 重跑回调，断言一旦没有立刻通过就会死循环。需要等样式时用 `await expect.element(el).toHaveStyle(...)` 或 `await expect.poll(fn).toHaveStyle(...)`。
- `getByRole('search', { name })` 找不到原生 `<search>` 元素（`@vitest/browser` 的 role engine 与 testing-library 都没有它的隐式角色映射）：用 `querySelector('search')` 断言 `aria-label`，或经 CDP `Accessibility.getFullAXTree` 读 Chrome 无障碍树确认 `role=search` 节点。
- 一个测试文件的 import 解析失败（文件改名、删除）会让 Vite 的错误遮罩留在共享页面上，之后同一页面的所有文件都因 `vite-error-overlay intercepts pointer events` 超时失败。整套大面积 30 秒超时时，先在日志里找 `Internal server error: Failed to resolve import`，不要逐个排查用例。

## 服务端渲染

写法协议见 [components](components.md#服务端渲染)。

| 项             | 约定                                                                                                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 服务端用例文件 | `*.ssr.test.{ts,tsx}`，放 `__tests__/`；jsdom 项目排除它们，只进入 node 环境的项目                                                                                                                               |
| 项目名         | `common-ssr`（框架无关包）、`<框架>-ssr`；均用 `vitest/framework.ts` 的 `nodeBase`（`environment: 'node'`、`TZ: 'Asia/Shanghai'`）与 `ssrTestFiles(id)`，不加载 `vitest/vitest.setup.ts`（它为 jsdom 补全局）    |
| 浏览器项目     | 名称必须以 `-browser` 结尾；Solid 的 hydration 项目为 `solid-hydration-browser`，文件后缀 `*.hydration.browser.test.tsx`，`solid-browser` 项目排除这一后缀                                                       |
| 用例表         | 每个包一张 `src/__tests__/ssr-cases.tsx`；每个导出组件一条最小用例；弹层与内部用弹层的组件另加默认打开用例；子组件放进父组件渲染                                                                                 |
| 用例名         | `<组件目录>/<场景>`，如 `tooltip/默认打开`、`date-picker/dateRange 受控值`；可以用 `-t '^(tooltip\|popover)/'` 按目录筛选                                                                                        |
| 守卫           | 遍历 `src/index.ts` 的组件导出，用例表缺项即失败（写法参照 `packages/semi-ai-vue/src/__tests__/override-default-props-coverage.test.ts`）                                                                        |
| 图标与插画     | 服务端循环渲染全部导出；hydration 只抽样                                                                                                                                                                         |
| 首帧内容       | 框架告警发现不了的差异用内容断言：受控值、DatePicker 已选日期文字、`md` 正文、Typography 文字（Solid）、虚拟化 Table 数据行（Vue）                                                                               |
| 时间           | 用例表中的 Calendar 一律传 `displayValue`；跨日用 `vi.setSystemTime` 在服务端渲染与 hydration 之间推进到次日，断言「今天」标记只在 hydration 后出现；跨时区不进单测                                              |
| hydration 环境 | React、Vue 在 jsdom 项目中 `renderToString` 后 hydration，jsdom 补丁放本框架的 setup 文件，不改 `vitest/setup.ts`；Solid 在 `solid-hydration-browser` 中（服务端与客户端是两套编译产物）；一律用开发构建判断告警 |

## 共享 spec

四个框架必须一致的可见行为写成一份框架无关的 spec，每个框架只提供夹具，避免同一组用例在四个包里各写一套而漂移。先例是 Tabs。

### 位置与协议

- spec 放 `vitest/specs/<组件目录名>.ts`，属通用范围，不导入框架模块，可用 `vite-plus/test`、`@testing-library/dom`、`@testing-library/user-event`；协议与 `defineSpec` 在 `vitest/specs/shared/define-spec.ts`。每个 spec 导出 `<组件>Spec(mount, options?)`，用例通过 `defineSpec` 的 `test` 声明，标题写法同「共同约定」。
- 夹具提供 `SpecMount<P>`：`(props: P) => SpecHandle<P> | Promise<SpecHandle<P>>`，`SpecHandle` 为 `{ container, update(partial), unmount() }`。`update` 把 `partial` 合并进当前 props（值为 `undefined` 的键照样传 `undefined`），框架重渲染完成后才 resolve。
- `P` 是该 spec 自己定义的框架无关 props，只含字符串、数字、布尔、普通对象数组和函数，不含框架节点。内容用数据表达（如 `items: { itemKey, tab, content, disabled?, closable? }[]`），由夹具转成本框架写法：React 与 Solid 的 children、Vue 的插槽、Svelte 的 `tabList` 加 snippet。回调参数的类型取各框架共有的部分（如事件只声明 `{ type: string }`，React 是合成事件）。
- 框架里的命名与受控方式差异由夹具映射，spec 用统一名字：Svelte 没有 `defaultActiveKey`，`activeKey` 单向传值时组件可本地覆盖，夹具用函数绑定 `bind:activeKey={getter, setter}`，getter 返回受控值，setter 拒绝写入，默认值作为绑定的初始值（见 `semi-ui-svelte/src/components/tabs/__tests__/tabs-spec-fixture.svelte`）。映射不了的差异不要硬凑，该用例留在框架自己的测试里。
- spec 只在 jsdom 项目里运行，只由各框架的非浏览器 tsconfig 检查；浏览器 tsconfig 带 `@vitest/browser` 的 matcher 类型，不得把 spec 纳入。React、Vue、Solid 的浏览器 tsconfig 只列 `*.browser.test.*`，天然不含夹具；Svelte 的浏览器 tsconfig 按 `__tests__/**/*.svelte` 收录，所以显式排除 `*-spec-fixture.svelte`，夹具必须以此命名。

### 什么进 spec

- 进：受控与非受控、默认值、回调的参数、禁用项、键盘与焦点（方向键、Home、End、RTL、`aria-orientation`）、ARIA 角色与状态、关闭、props 更新后的表现，且四个框架断言相同。
- 不进：已登记的框架差异（`docs/decisions.md`、`docs/release-notes.md`）、只在某个框架存在的 API（插槽、snippet、`TabItem` 的 ref 等）、断言比 spec 更细的用例、依赖真实布局、焦点环、指针的行为（放 `*.browser.test.*`，这次没有纳入）、依赖语言包文案的断言（spec 不读各框架的语言包）。按键会同步卸载当前焦点元素的行为（如可搜索 Select 按 Tab 关闭并卸载输入框）也不进：jsdom 里各框架的卸载时机不同，user-event 会丢掉 Tab 的起点，放浏览器测试。

### 写 spec 和夹具的规则

- 读文本先 `trim`：Svelte 的 snippet 文本带首尾空白。
- 夹具的 `container` 必须是 `HTMLElement`：Vue 的 `render` 返回 `Element`，夹具里写 `as HTMLElement`。
- 不在 spec 里往 DOM 里塞节点；需要节点内容的用例留在框架自己的测试里。
- 用点击得到「当前选中项」，不用默认值：Svelte 绑定的初始值在第一次交互前算受控。
- 查询范围用 `within(handle.container)`；弹层 portal 到 `document.body` 时用 `document.body` 范围，不要假设内容在 `container` 里。
- 每个夹具直接把 spec props 展开传给组件，只映射命名差异；不为让用例通过在夹具里补行为。
- spec 文件里 `describe(name)` 的 `vitest/valid-title` 已在 `lint/exemptions.ts` 为 `define-spec.ts` 豁免，新 spec 不需要再登记。

### 已知失败

某个框架表现与 spec 不同且没有登记依据，就是真实的行为漂移：不改 spec 迁就，也不在夹具里绕过。在该框架夹具入口传 `tabsSpec(mount, { fails: ['用例标题'] })`，该用例按 `it.fails` 运行；标题不存在时 `defineSpec` 抛错，修复后用例通过会让 `it.fails` 报失败，迫使清单随修复清空。同时把漂移登记到 `docs/decisions.md` 对应组件的小节。

### 守卫

`vitest/specs/__tests__/spec-fixtures.test.ts`（`common` 项目）遍历 `vitest/specs/*.ts`，断言 `lint/index.ts` 的 `frameworks` 里每个框架的 UI 包（`semi-ui-<框架>`）都有 `src/components/<组件>/__tests__/<组件>.spec.test.*`，缺一个即失败。

### 新增一个组件 spec

1. 从四个框架现有测试里找共同断言的行为，加上 APG 对该模式要求而现有用例漏掉的行为，写 `vitest/specs/<组件>.ts`：定义 `P`，用 `defineSpec` 声明用例。
2. 每个框架写 `packages/semi-ui-<框架>/src/components/<组件>/__tests__/<组件>.spec.test.{ts,tsx}`：实现 `mount` 后调用 `<组件>Spec(mount)`；Svelte 需要 `.svelte` 夹具时放同目录。
3. 四个框架都跑通后，从各自现有测试里删掉被 spec 完全覆盖的用例，断言更细的保留。
4. 每个框架跑 `vp test run --project <框架> packages/semi-ui-<框架>/src/components/<组件>`，再跑 `vp test run --project common vitest/specs`。

## 宿主夹具

宿主夹具把打包后的 Semi 包装进真实宿主应用（服务端渲染框架与纯客户端打包器），按用户的写法跑 dev、构建和生产，检查服务端 HTML、hydration、控制台和样式。它不是 Vitest 项目，由 Node 脚本运行。

### 目录与运行

- 运行器和共用断言在 `vitest/hosts/`：`run.ts`（运行器，不写框架名）、`types.ts`（`host.ts` 的类型）、`checks.ts`（共用断言）。
- 每个宿主一个 `vitest/<框架>/hosts/<宿主>/host.ts`，默认导出 `Host`。宿主名取自路径，跨框架不能重名。现有宿主：`next-app`、`next-pages`、`react-router`、`react-vite`、`react-webpack`、`react-rspack`、`nuxt`、`vue-vite`、`vue-webpack`、`vue-rspack`、`solidstart`、`solid-vite`、`solid-webpack`、`solid-rspack`、`sveltekit`、`svelte-vite`。
- 运行器先对全部可发布包（含已有 `dist` 的私有包）`pnpm pack` 一次。每个变体在仓库外的临时目录写入 `host.ts` 给出的文件，`package.json` 用 `file:` 指向 tarball，`pnpm-workspace.yaml` 的 overrides 把 Semi 包之间的依赖也指向 tarball，再 `pnpm install`。
- 安装失败时：缺的是 Semi 包，报 FAIL；否则（registry、网络或 pnpm store）报「环境」，该变体的其余检查标 SKIP。
- 宿主端口用空闲端口；浏览器用仓库已有的 Playwright Chromium，每个 `pnpm test:hosts` 进程同一时刻 1 个。每次运行用独立的临时目录和空闲端口，进程之间互不干扰，可以并行，但全机 Chromium 总数仍受上限约束。

### host.ts 的形态

| 类型              | 字段与含义                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Host`            | `deps`（固定版本的依赖，`@fibrae/semi-*` 写 `*`，由 tarball 替换）、`allowBuilds`、`files`（文件路径 -> 内容）、`variants`、`expectedFailures`；第一个变体是冒烟变体         |
| `Variant`         | `name`、`files`、`env`、`deps`（与宿主的同名项合并，同名时覆盖）、`dev`、`build`、`prod`（`prod` 在 `build` 通过后才跑）                                                     |
| `ServerStep`      | `command`（`{port}` 替换为空闲端口，同时作为 `PORT` 环境变量传入；要传框架的严格端口开关，否则端口被占时服务器会悄悄换端口）、`pages`、`checks`                              |
| `BuildStep`       | `command`、`checks`（检查构建产物）                                                                                                                                          |
| `HostPage`        | `name`（检查 id 的一段）、`path`、`ready`（只在 hydration 后由 effect 或 mount 钩子加上的元素的选择器，检查在它出现后才开始，不会跑在未 hydration 的服务端标记上）、`checks` |
| `ExpectedFailure` | `check`、`issue`、`evidence`，见下文                                                                                                                                         |

- 检查 id 为 `<变体>/<dev|build|prod>[/<页面>][/<检查名>]`，运行前就能确定。页面检查依序跑在同一个已 hydration 的页面上，`idsStable()` 放在会打开弹层的检查之前；运行器给每个页面追加 `console`（控制台 error、pageerror、hydration 告警）。
- 宿主配置只写用户文档里的写法（入门页与 Tailwind 页），不为夹具加额外配置；共用断言放 `checks.ts`，不在各 `host.ts` 里重复。
- 新增宿主只加 `host.ts`，运行器按 `vitest/*/hosts/*/host.ts` 自动发现。

### 预期失败清单

- `expectedFailures` 登记已知的失败：`check` 是完整检查 id，`issue` 是 `docs/decisions.md` 中登记该问题的组件小节标题（如 `Tooltip（及 Popover、Dropdown）`；没有登记的失败先登记再写清单），`evidence` 是失败信息或步骤日志必须包含的文本。
- 清单内的检查失败且 `evidence` 匹配，报「预期失败」，不计入失败；`evidence` 不匹配（换了原因）仍报 FAIL，不会被归到这条下面。
- 清单内的检查通过，报「清单过期」并以非 0 退出，迫使清单随修复清空；指向不存在的检查同样报「清单过期」。
- 条目由修复方在修复后自己删除；删条目后用 `pnpm test:hosts <宿主> --full` 确认没有新的失败。

### 何时跑

- 改动构建插件（`semi-vite`、`semi-nuxt`、`semi-next`、`semi-webpack`、`semi-rspack`）、包的发布形态（`exports`、`dist` 结构、`'use client'`、条件导出）、宿主相关代码（`vitest/hosts/`、各 `host.ts`），以及 Tailwind 文档或 `tailwind.css` 产物时跑；改组件逻辑不需要跑。
- 需要网络或预热的 pnpm store，先 `pnpm build`。
- `pnpm test:hosts [宿主...] [--full] [--keep]`：默认每个宿主只跑第一个变体，`--full` 跑全部变体；只传宿主名则只跑这些宿主。有 FAIL、「清单过期」或「环境」时退出码为 1。
- `--keep`：全部通过时也保留临时目录（失败时本来就保留），并打印临时目录、各变体的 app 目录和 dev 命令。手动起 dev：进入 app 目录，把 `node_modules/.bin` 放进 `PATH`，执行打印出的命令，`{port}` 换成空闲端口。用完用 `trash` 删除临时目录。

## strictNullChecks 探针

存量包不开启 strictNullChecks（见 [decisions](../../docs/decisions.md)「仓库与工程」）。想查空值 bug 时手动跑一次探针，不提交配置，不进 `pnpm check`：

1. 写 `tmp/strict-probe/tsconfig.json`，继承 foundation 的配置，只多开 `strictNullChecks`、`noEmit`：

    ```json
    {
        "extends": "../../packages/shared/semi-foundation/tsconfig.json",
        "compilerOptions": {
            "rootDir": "../../packages/shared/semi-foundation/src",
            "noEmit": true,
            "strictNullChecks": true
        },
        "include": ["../../packages/shared/semi-foundation/src/**/*.ts"],
        "exclude": ["../../packages/shared/semi-foundation/src/**/__tests__/**"]
    }
    ```

2. 运行 `pnpm exec tsc -p tmp/strict-probe/tsconfig.json`。foundation 约有 1000 个错误，只看来自 `null` 的：TS18047、TS2531，以及消息里含 `null` 的 TS2345、TS2322，筛完约 120 个。
3. 逐个判断：能指出实际触发场景（用户输入、解析失败、外部 API 返回 `null`）才算 bug，按 [fix-component-bug](../skills/fix-component-bug/SKILL.md) 修复；其余多是既定事实，忽略，不为过检查加判空或 `??`。

## 并行会话的端口

多个会话共用一台机器时，每个检出位置固定自己的文档站端口与浏览器测试 api 端口，互不重叠：

- 文档站：`pnpm --filter semi-website exec astro dev --port <端口> --host 127.0.0.1` 在后台运行，结束时只停自己启动的进程；check-pages 显式传 `http://127.0.0.1:<端口>`。
- 浏览器测试：`vp test run --project <项目>-browser --browser.api.port=<端口> <目录...>`。
- 主检出用默认值：文档站 4321，api 端口 63315。其他检出位置（worktree）各自分配不同的端口。
- 不用根 `package.json` 中写死端口的 `pnpm site:dev`、`site:preview`、`site:stop`（`site:stop` 还会停掉别人的服务）。

## 验证范围

- 按 AGENTS.md「验证」一节的改动类型表选命令；测试文件有改动时也跑 `pnpm build && pnpm typecheck`（测试的类型检查读取已构建的 `dist`）。修复后只重跑失败的文件。
- 全量单测、浏览器用例、`test:packed`、体积和全站页面扫描，在一批改动合入后跑一次，不为几行改动反复跑全套。多个 agent 并行跑全量会压满机器，引发超时和重跑。
- 框架包的类型读取 semi-foundation 已构建的 `dist`：foundation 有改动时，先 `pnpm build` 再 typecheck。只跑框架包的 `tsc` 查不出 foundation 自己的类型错误，要用根目录的 `pnpm typecheck`。
- `pnpm test:coverage` 的全局阈值在 `vitest/index.ts`、包级阈值在 `vitest/<框架>/index.ts`，按实测值向下取整，随覆盖率提升上调；它在一条命令里先跑完全量单测再跑全量浏览器用例（单测项目 `groupOrder` 为 0、浏览器项目为 1，由 `vitest/framework.ts` 统一设置，两者同跑会让浏览器用例超时），阈值对两段合起来的覆盖率检查，只在合入后（`check:full`）运行。SSR 与 hydration 项目（`*-ssr`、`*-hydration-browser`）不进覆盖率运行，由 `pnpm test:ssr` 在 `check:full` 中另跑：Vue、Solid 在这些项目里把同一源文件编译成服务端或 hydration 版本，istanbul 按路径合并后多出只有另一种编译才走得到的语句和分支，计入后覆盖率会随 SSR 用例增加而下降。带 `--coverage` 时浏览器依赖预构建缓存放在 `node_modules/.vite/coverage`，不与普通运行和编辑器的 Vitest 扩展共用：两者配置 hash 不同，共用时后启动的一方会删掉对方正在使用的 deps，浏览器会话报 `Failed to connect to the browser session`。
- `test:packed` 和 `test:plugins` 需要先 `pnpm build`。
- `pnpm size` 同样需要先 `pnpm build`，在合入后的 `check:full` 中跑一次；改动组件逻辑或依赖使体积有意变化时，用 `pnpm size --update` 重写 `size-budget.json` 并随改动提交。`node scripts/size.ts Button Spin` 单项查看体积明细。
- 完成声明要有本次实际运行的输出；未执行或无法验证的部分标 `UNKNOWN`，并写明验证条件。
