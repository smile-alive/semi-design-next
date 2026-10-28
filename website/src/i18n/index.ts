import type { Locale } from '#/i18n/locales';

// en-US uses satisfies to match the zh-CN keys, so missing or extra keys fail the type check.
const zhCN = {
    demo_code: '代码',
    demo_copy: '复制代码',
    demo_copied: '已复制',
    demo_copy_failed: '复制失败',
    token_note: '下表是组件内部的 Sass 变量，不能覆写。定制样式请覆写 --semi-* CSS 变量（见 Design Token 页），或写不分层的 CSS 规则。',
    token_variable: 'Sass 变量',
    token_default: '值',
    token_usage: '用法',
    nav_skip: '跳到正文',
    nav_menu: '导航菜单',
    nav_main: '主导航',
    nav_components: '组件',
    nav_theme: '切换暗色模式',
    nav_language: '切换语言',
    nav_framework: '切换框架',
    nav_docs: '文档导航',
    nav_prev_next: '上一篇与下一篇',
    toc_on_this_page: '本页目录',
    toc_demos: '代码演示',
    search_button: '搜索',
    search_open: '搜索组件',
    search_empty: '没有匹配的组件',
    search_clear: '清空',
    category_start: '开始',
    category_advanced: '设计协作',
    category_experience: '体验增强',
    category_ecosystem: '生态与帮助',
    category_ai: 'AI 组件',
    category_basic: '基础',
    category_plus: 'Plus 组件',
    category_input: '输入类',
    category_navigation: '导航类',
    category_show: '展示类',
    category_feedback: '反馈类',
    category_other: '其他',
};

export type UIKey = keyof typeof zhCN;

const enUS = {
    demo_code: 'Code',
    demo_copy: 'Copy code',
    demo_copied: 'Copied',
    demo_copy_failed: 'Copy failed',
    token_note: "These are the component's internal Sass variables and cannot be overridden. To customize styles, override the --semi-* CSS variables (see the Design Token page) or write unlayered CSS rules.",
    token_variable: 'Sass variable',
    token_default: 'Value',
    token_usage: 'Usage',
    nav_skip: 'Skip to content',
    nav_menu: 'Navigation menu',
    nav_main: 'Main',
    nav_components: 'Components',
    nav_theme: 'Toggle dark mode',
    nav_language: 'Switch language',
    nav_framework: 'Switch framework',
    nav_docs: 'Docs',
    nav_prev_next: 'Previous and next',
    toc_on_this_page: 'On this page',
    toc_demos: 'Demos',
    search_button: 'Search',
    search_open: 'Search components',
    search_empty: 'No matching components',
    search_clear: 'Clear',
    category_start: 'Start',
    category_advanced: 'Design Collaboration',
    category_experience: 'Experience',
    category_ecosystem: 'Ecosystem',
    category_ai: 'AI Component',
    category_basic: 'Basic',
    category_plus: 'Plus',
    category_input: 'Input',
    category_navigation: 'Navigation',
    category_show: 'Show',
    category_feedback: 'Feedback',
    category_other: 'Other',
} satisfies Record<UIKey, string>;

const ui = { 'zh-CN': zhCN, 'en-US': enUS } satisfies Record<Locale, Record<UIKey, string>>;

// Each language is shown in its own name, whatever the page locale
export const languageLabels = { 'zh-CN': '简体中文', 'en-US': 'English' } satisfies Record<Locale, string>;

export function translate(locale: Locale) {
    return (key: UIKey) => ui[locale][key];
}
