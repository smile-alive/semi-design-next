// 示例里 CodeHighlight 以及 MarkdownRender、Chat、AIChatDialogue、Sidebar 代码块用到的语言，在站点入口统一注册；
// 未注册的语言按纯文本显示。注册晚于示例挂载时，已挂载的代码块会重新高亮。与组件共用 foundation 的注册表，
// 页面脚本因此不必加载 React 与 semi-ui-react 入口
import { register } from '@fibrae/semi-foundation/code-highlight/registry';

register({
    languages: [
        () => import('shiki/langs/javascript.mjs'),
        () => import('shiki/langs/typescript.mjs'),
        () => import('shiki/langs/jsx.mjs'),
        () => import('shiki/langs/tsx.mjs'),
        () => import('shiki/langs/css.mjs'),
        () => import('shiki/langs/html.mjs'),
        () => import('shiki/langs/json.mjs'),
        () => import('shiki/langs/bash.mjs'),
    ],
});
