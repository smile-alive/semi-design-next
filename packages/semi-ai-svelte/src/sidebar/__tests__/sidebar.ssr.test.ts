import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { Annotation, MCPConfigure, Sidebar } from '../index';

const text = zh_CN.Sidebar;

describe('Sidebar 服务端首帧', () => {
    it('可见时输出容器、标题、带名称的关闭按钮与选项', () => {
        const { body } = render(Sidebar, {
            props: {
                visible: true,
                title: '侧栏',
                activeKey: 'one',
                options: [
                    { name: '选项一', key: 'one' },
                    { name: '选项二', key: 'two' },
                ],
            },
        });
        expect(body).toContain('semi-sidebar-container');
        expect(body).toContain('semi-sidebar-main');
        expect(body).toContain('侧栏');
        expect(body).toContain(`aria-label="${text.close}"`);
        expect(body).toContain('aria-pressed="true"');
        expect(body).toContain('选项二');
    });

    it('不可见时不输出容器', () => {
        const { body } = render(Sidebar, { props: { visible: false } });
        expect(body).not.toContain('semi-sidebar-container');
    });

    it('详情模式输出返回、复制按钮与代码内容', () => {
        const { body } = render(Sidebar, { props: { visible: true, mode: 'code', detailContent: { name: 'demo.ts', content: 'const a = 1;' } } });
        expect(body).toContain('semi-sidebar-detail');
        expect(body).toContain('demo.ts');
        expect(body).toContain(`aria-label="${text.copy}"`);
        expect(body).toContain('semi-sidebar-code-content');
    });

    it('文件模式首帧只有编辑器的根节点，工具栏等编辑器就绪后才出现', () => {
        const { body } = render(Sidebar, { props: { visible: true, mode: 'file', detailContent: { name: 'doc', content: '<p>x</p>' } } });
        expect(body).toContain('semi-sidebar-file-editor');
        expect(body).not.toContain('semi-sidebar-file-menu-bar');
    });

    it('Annotation 输出默认标题与分组头', () => {
        const { body } = render(Annotation, { props: { visible: true, info: [{ header: '分组', key: 'g', annotations: [{ title: '文章', url: 'https://example.com' }] }] } });
        expect(body).toContain(text.annotationTitle);
        expect(body).toContain('分组');
    });

    it('MCPConfigure 输出模式切换、计数与列表', () => {
        const { body } = render(MCPConfigure, { props: { visible: true, options: [{ label: '搜索', value: 'search', active: true }] } });
        expect(body).toContain(`aria-label="${text.mcpConfigure}"`);
        expect(body).toContain('搜索');
        expect(body).toContain(`${text.activeMCPNumber} 1/1`);
        expect(body).toContain(`aria-label="${text.disable}"`);
    });
});
