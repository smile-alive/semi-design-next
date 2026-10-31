import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Annotation from '../annotation';
import type { AnnotationInfo } from '../annotation/content';
import type { Option } from '../interface';
import MCPConfigure from '../mcp-configure';
import type { MCPSolidOption } from '../mcp-configure/content';
import Sidebar from '../sidebar';

// Records each call, so a render function called for a node that is never inserted shows up
function counter() {
    const created: string[] = [];
    const mark = (id: string) => {
        created.push(id);
        return <i data-mark={id} />;
    };
    return { created, mark };
}

it('类型：选项、MCP 项与参考来源分组只放数据', () => {
    // @ts-expect-error the option name is text; the icon goes through renderOptionIcon
    const option: Option = { name: <b />, key: 'a' };
    // @ts-expect-error a non-URL icon goes through renderIcon
    const mcp: MCPSolidOption = { value: 'a', icon: <b /> };
    // @ts-expect-error a non-text desc goes through renderDesc
    const mcpDesc: MCPSolidOption = { value: 'a', desc: <b /> };
    // @ts-expect-error a non-text header goes through renderInfoHeader
    const info: AnnotationInfo = { header: <b />, key: '1', annotations: [] };
    expect([option, mcp, mcpDesc, info]).toHaveLength(4);
});

it('Sidebar 的选项图标由 renderOptionIcon 在每个按钮里创建一次', async () => {
    const { created, mark } = counter();
    const options: Option[] = [
        { name: 'Code', key: 'code' },
        { name: 'File', key: 'file' },
    ];
    const { html, errors } = await renderServer({ render: () => <Sidebar visible options={options} renderOptionIcon={(option) => mark(option.key)} /> });
    expect(errors).toEqual([]);
    expect(html).toContain('data-mark="code"');
    expect(html).toContain('data-mark="file"');
    expect(created).toEqual(['code', 'file']);
});

it('Sidebar 与 Container 隐藏时不创建 header、detail 的内容', async () => {
    const { created, mark } = counter();
    const hidden = await renderServer({
        render: () => <Sidebar mode="code" visible={false} renderDetailHeader={() => mark('detail-header')} renderDetailContent={() => mark('detail-content')} />,
    });
    expect(hidden.errors).toEqual([]);
    expect(hidden.html).not.toContain('data-mark');

    const container = await renderServer({ render: () => <Sidebar.Container visible={false} renderHeader={() => mark('container-header')} /> });
    expect(container.errors).toEqual([]);
    expect(created).toEqual([]);

    const shown = await renderServer({ render: () => <Sidebar.Container visible renderHeader={() => mark('container-header')} /> });
    expect(shown.html).toContain('data-mark="container-header"');
    expect(created).toEqual(['container-header']);
});

it('MCPConfigure 的图标与描述由 renderIcon、renderDesc 在每行创建一次，字符串图标是图片地址', async () => {
    const { created, mark } = counter();
    const options: MCPSolidOption[] = [
        { label: 'GitHub', value: 'github', icon: 'https://semi.design/github.png', desc: 'Code hosting' },
        { label: 'Figma', value: 'figma' },
    ];
    const plain = await renderServer({ render: () => <MCPConfigure visible options={options} /> });
    expect(plain.errors).toEqual([]);
    expect(plain.html).toContain('src="https://semi.design/github.png"');
    expect(plain.html).toContain('Code hosting');

    const custom = await renderServer({
        render: () => <MCPConfigure visible options={options} renderIcon={(args) => mark(`icon-${args.option.value}`)} renderDesc={(args) => mark(`desc-${args.option.value}-${String(args.custom)}`)} />,
    });
    expect(custom.errors).toEqual([]);
    expect(custom.html).not.toContain('github.png');
    expect(custom.html).toContain('data-mark="icon-github"');
    expect(created).toEqual(['icon-github', 'desc-github-false', 'icon-figma', 'desc-figma-false']);
});

it('Annotation 的分组标题由 renderInfoHeader 创建，AnnotationContent 的由 renderHeader 创建', async () => {
    const { created, mark } = counter();
    const info: AnnotationInfo[] = [{ header: 'References', key: '1', annotations: [{ title: 'Annotation title' }] }];
    const plain = await renderServer({ render: () => <Annotation visible info={info} /> });
    expect(plain.errors).toEqual([]);
    expect(plain.html).toContain('References');

    const annotation = await renderServer({ render: () => <Annotation visible info={info} renderInfoHeader={(item) => mark(`annotation-${item.key}`)} /> });
    expect(annotation.errors).toEqual([]);
    expect(annotation.html).toContain('data-mark="annotation-1"');
    expect(annotation.html).not.toContain('References');

    const content = await renderServer({ render: () => <Annotation.AnnotationContent info={info} renderHeader={(item) => mark(`content-${item.key}`)} /> });
    expect(content.errors).toEqual([]);
    expect(content.html).toContain('data-mark="content-1"');
    expect(created).toEqual(['annotation-1', 'content-1']);
});
