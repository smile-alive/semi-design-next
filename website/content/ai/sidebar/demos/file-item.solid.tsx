import { createSignal } from 'solid-js';
import { Sidebar, type ImageUploadNodeOptions } from '@fibrae/semi-ai-solid';
import { Button } from '@fibrae/semi-ui-solid';

const { FileItem } = Sidebar;

const defaultFileContent = `<h2>
  Semi Design 介绍
</h2>
<p>
  Semi Design 是由 <strong>抖音前端团队</strong>和MED产品设计团队设计、开发并维护的<em>设计系统</em>。作为一个全面、易用、优质的现代应用UI解决方案，Semi Design从字节跳动各业务线的复杂场景中提炼而来，目前已经支撑了近千个平台产品，服务了内外部超过10万用户，详情见https://semi.design/zh-CN/start/introduction。Semi Design的特点包括：
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
  Semi Design 是由抖音前端团队和MED产品设计团队设计、开发并维护的设计系统
  <br />
  — Semi Design
</blockquote>`;

const imgUploadProps: ImageUploadNodeOptions = {
    action: 'https://api.semi.design/upload',
    getUploadImageSrc: () => {
        // response is the action's result; real code reads the uploaded image URL from it
        return '/assets/placeholder/avatar-a.svg';
    },
};

export default function SidebarDemo() {
    const [editable, setEditable] = createSignal(true);

    return (
        <>
            <Button aria-pressed={editable()} onClick={() => setEditable((current) => !current)}>
                可编辑
            </Button>
            <br />
            <br />
            <FileItem name="Semi Design 介绍" content={defaultFileContent} editable={editable()} style={{ border: '1px solid var(--semi-color-border)', padding: '12px' }} imgUploadProps={imgUploadProps} />
        </>
    );
}
