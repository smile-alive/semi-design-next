# 代码风格

TS/TSX 源码中工具决定不了的写法。格式（含 `sortImports`）交给 `vp fmt`，lint 交给 `vp lint`，规则以 `lint/` 为准（见 [lint](lint.md)）。JSX 属性顺序等框架写法见各框架目录的 `components.md`。组件相关写法见 [components](components.md)。

## 命名

- TypeScript 使用 strict；部分包的 strictNullChecks 例外见「TypeScript」节。模板格式由 oxfmt 处理，脚本与模板 lint 的边界见 [lint](lint.md)。
- 包内目录和文件名用 kebab-case（`date-picker/months-grid-foundation.ts`、`modal/modal-content.tsx`），测试与样式文件同样如此；语言包文件名保留语言标签写法（`zh_CN.ts`）。文档站页面目录与组件目录同名。

## 导出

- 本文件声明的值、函数、类、类型，在声明处导出：`export const cssClasses = {...}`、`export function f()`、`export class X`、`export interface P`。不在文件末尾用 `export { a, b }` 汇总导出本地声明。
- 导出 import 进来的名字用 `export { x } from './x'`；本文件也要用 `x` 时保留 import。
- 以别名导出本地声明（`export { CheckboxWithGroup as Checkbox }`）无法在声明处表达，保留这种写法。
- 默认导出的类和函数写在声明处：`export default class CarouselFoundation`、`export default function Spin()`。默认导出的是表达式结果（`memo(X)`、`Object.assign(...)`、对象字面量、`createContext(...)`）时，写 `export default X` 或直接导出表达式。

## 函数

按函数的用途选写法，测试与文档站 demo 同样适用：

| 场景                                                                 | 写法                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| 组件（大驼峰命名、返回 JSX 的函数），含 HOC 与测试回调内定义的组件   | 任何层级都用 `function` 声明：`function Demo() {}`             |
| 函数体是单个表达式的小函数                                           | 任何层级都可以写箭头：`const isAriaKey = (key) => ...`         |
| 函数体有多条语句、定义在模块顶层                                     | `function` 声明                                                |
| 函数体有多条语句、定义在函数体内（组件、hook、类方法、普通函数内部） | `const f = () => {}`，并定义在第一次同步调用之前：箭头没有提升 |

- 不写 `const f = function () {}`。
- Vue 的 `<script setup>` 与 Svelte 的实例 `<script>` 编译进组件函数，顶层按函数体内处理；Vue 的普通 `<script>` 与 Svelte 的 `<script module>` 按模块顶层处理。
- 例外：
    - Svelte 组件的对外方法写 `export function focus() {}`（Svelte 文档的组件导出写法，component-order 按这个形式识别对外句柄）。
    - 变量要用函数类型整体标注时保留箭头：`const linear: Easing = (t) => t`。
    - 需要 `this` 参数、重载、生成器或 `asserts` 返回类型的函数，在任何位置都用 `function` 声明（`asserts` 函数写成箭头会在调用处报 TS2775）。
    - `debounce(...)`、`memo(...)` 等调用结果是值，不是函数定义，不受本节约束。
- 参数只用于一次解构时，在形参处解构：写 `function f({ a, b }: Props)`，不写 `function f(props: Props) { const { a, b } = props; }`。参数在别处还有用到（传给其他函数、整体展开、再次读取属性）时保留参数名。解构默认值含 JSX 时例外，在函数体内判断，见各框架目录的 `components.md`。

## TypeScript

- 返回类型：函数推断出的返回类型与手写的注解一致时不写注解，不分原始类型、对象、数组、Promise，导出与否都一样。一致指类型检查器给出的返回类型相同，导出的函数生成的 d.ts 里的类型也不变；只差成员顺序或写法（`Array<T>` 与 `T[]`、`import("...")` 与具名导入）不算不一致。不一致时要写，常见的有：类型谓词与 `asserts`；去掉后类型变宽（字面量变成 `string`、可选属性变成必选、一个对象变成多个对象的联合）或从具体类型变成 `any`；生成的 d.ts 把类型别名、`typeof` 或索引访问展开成字面量（如 `Role` 变成几十个成员的联合），或写出默认类型参数（如 `VNode` 变成 `VNode<RendererNode, ...>`）；生成的 d.ts 会引用不该暴露的类型（如[组件协议](components.md)中没有根元素的组件）；含 `null` 或 `undefined` 的联合（如 `string | undefined`）：包内关闭了 `strictNullChecks`，推断会丢掉它们，生成的 d.ts 对开启 `strictNullChecks` 的使用方就变窄了。
- 可选参数写 `x?: T`，不写 `x: T | undefined`；`T | null | undefined` 写成 `x?: T | null`。后面没有必选参数时才适用，函数类型、回调（如 `createMemo((previous?: T) => ...)`）的参数也一样；末尾参数改成可选后，前一个参数随之满足条件时一并改。interface 和类型字面量的属性写 `p?: T`；类字段保留 `| undefined`。
- 变量注解与初始值的 `as` 断言写的是同一类型时只留断言：写 `const props = { ... } as Props`，不写 `const props: Props = { ... } as Props`。
- 纯类型导入写 `import type`；同一模块既导入值又导入类型时合并成一条，类型写成行内 `type`：`import BaseFoundation, { type DefaultAdapter } from '...'`（由 `import/no-duplicates` 的 `preferInline` 检查）。oxlint 1.85 的 `--fix` 合并默认导入与 `import type` 时会生成非法的 `import X, type { Y }`，这类报错手工合并。
- 判空写 `x == null`、`x != null`（同时覆盖 null 与 undefined），默认值用 `??`；类型判断用 `typeof`。一个 `typeof`、`== null` 或 `instanceof` 就能写完的判断不封装（不写 `isNullOrUndefined`、`isString`）。要组合多个条件的类型判断（`isObject`、`isElement`、`isPromise`）只在 `semi-foundation/src/utils` 定义一次，各框架包导入使用，不在框架包里另写一份；不依赖 foundation 的包（如 `semi-json-viewer-core`）在调用处直接写判断。
- semi-foundation 和沿用 `tsconfig.base.json` 设置的包没有开 `strictNullChecks`（D11），框架包以自己的 `tsconfig.json` 为准；`semi-animation` 单独开了 strict。

## 类成员

- 私有状态、方法、访问器和静态成员一律用 `#name`，不用 TS `private`，不加 `_` 前缀。`pnpm lint:private` 在全仓拒绝 `private`。
- 要附在不归自己管的对象（第三方实例、DOM 节点）上的私有数据，放进模块内的 `WeakMap`，不往对象上挂属性。
- TS 只用于 JS 表达不了的部分：类型、`protected`（子类共享，如 BaseFoundation 的 `adapter`，同样不加 `_` 前缀）、`abstract`、`readonly`、`implements`、`override`、泛型。不写 `public`，不用构造参数属性（由 lint 检查）。覆写基类成员（`init`、`destroy`、`render` 等）必须写 `override`（`noImplicitOverride`，`static` 写在 `override` 之前）；不留未使用的局部变量与导入（`noUnusedLocals`）。不留未使用的参数（`noUnusedParameters`，oxlint 的 `no-unused-vars` 同样检查）：内联回调删掉末尾不用的参数，排在已用参数前面、不用的参数加 `_` 前缀；导出函数、类方法、实现接口或覆写的方法只加 `_` 前缀，不删参数，以免改变对外签名；`forwardRef` 的渲染函数保留两个参数。
- 成员顺序，由 `pnpm lint:class-order` 检查：
    - 索引签名、字段、构造函数、方法。箭头函数字段和 `debounce`、`throttle`、`.bind` 包装字段算方法。
    - 字段和方法内部各按 `#` 私有、`protected`、公开排列；同一可见性内 `static` 在前，其余保持原相对顺序。
    - 重载签名相邻（`typescript/adjacent-overload-signatures`），getter 和 setter 成对（`grouped-accessor-pairs`）。
    - 数据字段的初始化表达式不在构造期读 `this`，否则字段顺序会影响运行结果。要用其他成员时延后读取，如 `#run = debounce(() => this.#x(), 100)`。
- 可见性按调用方决定：
    - UI 包、adapter 调用的保持公开。
    - 允许第三方子类覆盖或复用的纯计算、策略方法用 `protected` 原型方法，不写成箭头字段（例如 Carousel 的 `getValidIndex`、`getSwitchingTime`、`handleNewActiveIndex`）。
    - 计时器、状态字段、必须按顺序执行的内部步骤用 `#`。拿不准时先用 `#`，以后放宽比收紧容易。
- 再按用途选写法。原型方法所有实例共享一份，子类能覆盖、能用 `super` 调用，用于类内部和子类扩展点；箭头字段在每个实例上各建一份，`this` 固定指向该实例，框架层（UI 包、adapter）既能直接调用也能直接当值传，框架层调用的成员都写成箭头字段。按先后判断，命中第一条即停：

1. 不读实例状态的纯计算 -> `static`
2. 子类覆盖的扩展点、BaseFoundation 的共用方法 -> 原型方法（`protected` 或公开）
3. 框架层（UI 包、adapter）调用，无论直接调用还是当值传 -> 公开箭头字段
4. 只在类内使用但引用会被当值传出（监听器、`openLayer`、交给 Field 的 updater 对象）-> `#` 箭头字段
5. 只在类内直接调用 -> `#` 原型方法
6. 覆写父类成员的一律加 `override`

各场景对照：

| 场景                                                                                                                                     | 写法                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 只在类内部调用                                                                                                                           | `#` 原型方法                                                                                    |
| 框架层调用的对外 API，含直接传给组件 prop、模板事件或监听器的回调（子类扩展点除外）                                                      | 公开箭头字段，名字不带 `_`；当值传时直接传 `onChange={foundation.handleChange}`，不再包一层箭头 |
| 需要稳定引用的回调（成对的 add/removeEventListener、observer、subscribe、`useSyncExternalStore`）                                        | 箭头字段；只在类内注册的用 `#`                                                                  |
| 类内一次性回调（`setTimeout`、`then`、`map`）                                                                                            | 原型方法，调用点写 `() => this.#x()`                                                            |
| 预置参数                                                                                                                                 | 原型方法加 `.bind(this, arg)` 或内联箭头                                                        |
| 子类覆盖的扩展点（`init`、`destroy`、`getStates`），BaseFoundation 供所有子类共用的方法（`getState`、`setState`、`getProp`、`getProps`） | 原型方法。父类的箭头字段会遮蔽子类方法，子类的箭头字段无法用 `super` 调用                       |
| debounce、throttle                                                                                                                       | 包装字段，优先 `#`，内部写 `() => this.#x()`                                                    |
| 不用 `this` 的派生计算，供外部以 `XFoundation.x()` 调用                                                                                  | `static`                                                                                        |
| 存放外部注入回调的函数槽                                                                                                                 | 带函数类型的普通字段                                                                            |

- 原型方法不能直接当作值传出，否则 `this.#x` 会抛错；UI 要直接传的回调按上表写成箭头字段，其余场景包一层箭头或先绑定。类型感知的 `typescript/unbound-method` 会拦下这种写法；只把方法交给 `expect()` 等不调用它的测试代码在文件所属框架的 `lint/<框架>/exemptions.ts`（框架无关的文件用 `lint/exemptions.ts`）按文件豁免。
- 箭头字段的参数按逆变检查，原型方法的参数是双变的：宿主以基类泛型持有 foundation（如 `TableFoundation<any, TableBaseProps<any>>`）时，箭头字段的参数写基类类型，不写子类泛型 `P`、`S`（Table 的 `handleUpdate`）。
- 不等待的 Promise 写 `void p`，需要结果或错误时 `await` / `.catch`（`typescript/no-floating-promises`）。不为了消掉报错吞错。
- `#` 成员和箭头字段在 prototype 上都 spy 不到：测试断言行为，不为了 spy 改变成员写法。

## 依赖与工具函数

- 类型判断与空值处理用语言原语（`typeof`、`?.`、`??`）；固定路径的取值写 `a?.b ?? d`，不写 `get(a, 'b', d)`。数组用不可变方法（`toSorted`、`toReversed`、`with`、`at`），集合运算用 es-toolkit 的 `difference`、`xor`、`uniq` 或 `every` 加 `Set.has`（Set methods 要到 Chrome 122、Firefox 127），分组用 es-toolkit 的 `groupBy`、`countBy`（`Map.groupBy` 要到 Safari 17.4），用户输入转义用 es-toolkit 的 `escapeRegExp`（`RegExp.escape` 要到 Chrome 136），属性判断用 `Object.hasOwn`，键盘用 `KeyboardEvent.key`。新用到的 API 先按 D15 的目标浏览器查 MDN 兼容表。
- es-toolkit：
    - 先用主入口。注意主入口的 `merge(target, source)` 只接收两个参数，source 为 `undefined` 时会抛错；`pick` 只接受单层键名，对象为 null 时会抛错。
    - 只有语义与主入口不同的函数（`get`、`set`、`has`、`unset`、`toPath` 等，路径由使用方传入，例如 Table 的 `dataIndex`）才从 `es-toolkit/compat` 导入，每个文件一行 `import { ... } from 'es-toolkit/compat'`。
- 纯数据拷贝可用 `structuredClone`。
- 与框架无关的工具放进 `packages/semi-foundation/src/utils`，并补 `__tests__`。
- `noop` 用 semi-foundation `utils/function` 导出的具名 `noop`：InputGroup 会检查函数名。
- 依赖版本：两个及以上的包共用的依赖在 `pnpm-workspace.yaml` 的 `catalog` 里定版本，写 `catalog:`；`catalogMode: prefer` 会把只有一个包用的依赖也写成 `catalog:`，这种情况改回普通版本范围。

## Node 脚本

- 根 `package.json` 是 `"type": "module"`。脚本写成 `.ts`，由 Node 26 的类型剥离直接运行（`node scripts/x.ts`）：只用可擦除语法（不写 `enum`、namespace、参数属性），纯类型导入写 `import type`，相对导入带 `.ts` 后缀。
- `tsconfig.node.json` 检查根配置、`scripts/`、`packages/*/scripts`、`packages/*/test/run.ts` 和 `vitest/packed`；website 下的脚本由 `website/tsconfig.json` 检查。
- 解析源码做统计或 codemod 见 [ast](ast.md)。
