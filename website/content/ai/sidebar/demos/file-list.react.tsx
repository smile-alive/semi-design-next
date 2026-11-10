import { useState, useCallback } from 'react';
import { Sidebar } from '@fibrae/semi-ai-react';

const defaultFiles = [
    {
        key: 'file1',
        name: 'Semi Design 介绍',
        content: `
<h2>
  Semi Design 介绍
</h2>
<p>
  Semi Design Next 是 <strong>Semi Design</strong> 的社区版<em>设计系统</em>，一套组件在 React、Vue、Solid、Svelte 中原生可用。作为一个全面、易用、优质的现代应用UI解决方案，详情见https://semi-design-next.pages.dev/zh-CN/react/start/introduction。Semi Design的特点包括：
</p>
<ul>
  <li>
    设计简洁、现代化。
  </li>
  <li>
    提供主题方案，可深度样式定制。
  </li>
</ul>
<p>
  国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。
</p>
<blockquote>
  Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用
  <br />
  — Semi Design
</blockquote>
<p>
  Semi Design Next 是 <strong>Semi Design</strong> 的社区版<em>设计系统</em>，一套组件在 React、Vue、Solid、Svelte 中原生可用。作为一个全面、易用、优质的现代应用UI解决方案，详情见https://semi-design-next.pages.dev/zh-CN/react/start/introduction。Semi Design的特点包括：
</p>
<ul>
  <li>
    设计简洁、现代化。
  </li>
  <li>
    提供主题方案，可深度样式定制。
  </li>
</ul>
<p>
  国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。
</p>
<blockquote>
  Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用
  <br />
  — Semi Design
</blockquote>
<p>
  Semi Design Next 是 <strong>Semi Design</strong> 的社区版<em>设计系统</em>，一套组件在 React、Vue、Solid、Svelte 中原生可用。作为一个全面、易用、优质的现代应用UI解决方案，详情见https://semi-design-next.pages.dev/zh-CN/react/start/introduction。Semi Design的特点包括：
</p>
<ul>
  <li>
    设计简洁、现代化。
  </li>
  <li>
    提供主题方案，可深度样式定制。
  </li>
</ul>
<p>
  国际化，覆盖了简/繁体中文、英语、日语、韩语、葡萄牙语等20+种语言，日期时间组件提供全球时区支持，全部组件可自动适配阿拉伯文RTL布局。
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  采用 Foundation 和 Adapter 跨框架技术方案，方便扩展。
</p>
<blockquote>
  Semi Design Next 是 Semi Design 的社区版设计系统，一套组件在 React、Vue、Solid、Svelte 中原生可用
  <br />
  — Semi Design
</blockquote>
`,
    },
    {
        key: 'file2',
        name: 'Semi Design Next theming',
        content: `<h2>
  Semi Design Next theming
</h2>
<p>Semi Design Next themes through <code>--semi-*</code> variables. It supports global and component-level style customization. Suitable for teams of all sizes. Whether you need to simplify workflow, improve team collaboration, or increase productivity, we have features suitable for you.</p>
`,
    },
    {
        key: 'file3',
        name: 'React v19 Adaptation',
        content: `<h2>
  React v19 Adaptation
</h2>
<p>Since the release of React v19, React has introduced numerous underlying mechanism and API changes, including upgrades and adjustments to the render mechanism, ref, context, TypeScript types, and related deprecated APIs. To ensure that the Semi Design component library is smoothly compatible with both React v19 and lower versions, we provide the original component package @fibrae/semi-ui-react for React versions below v19, as well as a new package @fibrae/semi-ui-19 specifically adapted for React v19, so users can choose as needed. This guide will help you understand how to install, use, and the precautions to take.
Installation & Usage
If your project is using React v19, please use @fibrae/semi-ui-19. For React versions below v19, continue using @fibrae/semi-ui-react as before.</p>
`,
    },
];

export default function SidebarDemo() {
    const [activeKey, setActiveKey] = useState<string | string[]>('file1');

    const onChange = useCallback((key: string | string[]) => {
        setActiveKey(key);
    }, []);

    return (
        <div className="semi-sidebar-main">
            <Sidebar.FileContent style={{ width: 600 }} activeKey={activeKey} files={defaultFiles} onChange={onChange} />
        </div>
    );
}
