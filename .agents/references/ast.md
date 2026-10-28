# AST 解析

需要解析 JS、TS、JSX 源码做统计、检查或 codemod 时，用仓库已有的解析器，不新增 `oxc-parser`、`@babel/parser`、`ts-morph`、`jscodeshift` 等依赖。

## 选择

| 需求                                               | 用法                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 语法层面（声明形式、导入导出、成员写法、调用位置） | Oxc：`vite/rolldown/utils` 的 `parseSync`，或 `vite/rolldown/parseAst` 的 `parseAst` |
| 需要类型信息或作用域内重命名                       | 根依赖 `typescript` 的编译器 API                                                     |

`vite` 在 `pnpm-workspace.yaml` 的 catalog 中映射为 `@voidzero-dev/vite-plus-core`，并通过 overrides 应用到整个工作区。Oxc 解析器随它提供，与 `vp lint`、`vp pack` 用的是同一套工具链。

返回结构（vite-plus-core 1.0.0 实测；`rolldown/experimental` 里的同名导出已标记弃用，不要再用）：

- `parseSync(文件名, 源码)` 按文件扩展名选语法，返回 `{ program, module, comments, errors }`。语法错误放在 `errors` 里，不会抛出：必须检查 `errors.length`，非空就报错退出，不能在不完整的 AST 上继续统计或改写。
- `parseAst(源码, { lang })` 直接返回 `Program`，语法错误时抛出。
- 节点的 `start`、`end` 是 UTF-16 偏移，可以直接对 JS 字符串 `slice`，不用换算字节。

## 引用方式

仓库内的脚本（`scripts/*.ts` 等）直接按包名导入：

```ts
import { parseSync } from 'vite/rolldown/utils';
```

仓库外的临时脚本（例如会话的 scratchpad）从仓库根解析包名。不写相对路径，也不写 `.pnpm/` 下带哈希的路径。在仓库根目录运行脚本，`createRequire` 的参数取当前目录下的 `package.json`：

```ts
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRequire = createRequire(join(process.cwd(), 'package.json'));
const { parseSync } = await import(pathToFileURL(repoRequire.resolve('vite/rolldown/utils')).href);
const ts = repoRequire('typescript');
```

## 约束

- 一次性的统计和 codemod 脚本放在仓库外的临时目录，不提交。需要长期运行的检查脚本放在 `scripts/*.ts`，由 `tsconfig.node.json` 做类型检查。
- 只读统计可以直接运行。用 codemod 改写仓库文件前，先说明改写范围并取得用户确认；改写后用一个脚本比对改写前后的成员或文本，作为验证证据。
- 改写时按 AST 节点的 `start`、`end` 区间拼接原文，不用正则替换源码，也不从 AST 重新生成代码：Oxc 只负责解析，不输出代码；按区间拼接才能保留注释和格式。改写后跑 `vp fmt` 和相关检查。
- 统计口径（如何识别组件、hook、回调传递）写进报告；无法静态判定的情况列为例外，不要猜。
