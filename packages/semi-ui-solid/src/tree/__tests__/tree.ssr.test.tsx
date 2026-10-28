import type { JSX } from 'solid-js';
import { expect, expectTypeOf, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Tree, { type TreeNodeData, type TreeProps } from '..';

const treeData: TreeNodeData[] = [
    {
        label: 'Asia',
        key: 'asia',
        children: [
            { label: 'Beijing', key: 'beijing' },
            { label: 'Tokyo', key: 'tokyo' },
        ],
    },
    { label: 'Europe', key: 'europe' },
];

function counter() {
    const created: string[] = [];
    const counted = (name: string) => {
        created.push(name);
        return <i>{name}</i>;
    };
    return { created, counted };
}

it('tree/renderFullLabel 接管整行时不创建 icon', async () => {
    const { created, counted } = counter();
    const { html, errors } = await renderServer({
        render: () => <Tree defaultExpandAll treeData={treeData} icon={counted('tree')} renderFullLabel={(row) => <div class={row.class}>{row.data.label}</div>} />,
    });
    expect(errors).toEqual([]);
    expect(html).toContain('Beijing');
    expect(created).toEqual([]);
});

it('tree/每行只创建一次插入的 icon', async () => {
    const { created, counted } = counter();
    const { errors } = await renderServer({ render: () => <Tree defaultExpandAll treeData={treeData} icon={(row) => counted(row.eventKey)} /> });
    expect(errors).toEqual([]);
    expect(created).toEqual(['asia', 'beijing', 'tokyo', 'europe']);
});

it('tree/节点数据里的 icon 不再读取，行图标来自 Tree 的 icon', async () => {
    const { counted } = counter();
    // @ts-expect-error a node carries no markup: the tree's icon draws every row's icon
    const data: TreeNodeData[] = [{ label: 'Europe', key: 'europe', icon: counted('data') }];
    const { html, errors } = await renderServer({ render: () => <Tree treeData={data} icon={counted('tree')} /> });
    expect(errors).toEqual([]);
    expect(html).toMatch(/<i[^>]*>tree<\/i>/);
    expect(html).not.toMatch(/<i[^>]*>data<\/i>/);
});

it('tree/renderFullLabel 的 expandIcon 是渲染函数，在插入处调用时才创建', async () => {
    expectTypeOf<Parameters<NonNullable<TreeProps['renderFullLabel']>>[0]['expandIcon']>().toEqualTypeOf<() => JSX.Element>();
    const { created, counted } = counter();
    const { html, errors } = await renderServer({
        render: () => <Tree defaultExpandAll treeData={treeData} expandIcon={counted('arrow')} renderFullLabel={(row) => <div class={row.class}>{row.data.children?.length ? row.expandIcon() : null}</div>} />,
    });
    expect(errors).toEqual([]);
    expect(html).toMatch(/<i[^>]*>arrow<\/i>/);
    // only the branch row calls it
    expect(created).toEqual(['arrow']);
});

it('tree/renderFullLabel 取出 expandIcon 但不调用时，不创建展开按钮', async () => {
    const { created, counted } = counter();
    const { html, errors } = await renderServer({
        render: () => (
            <Tree
                defaultExpandAll
                treeData={treeData}
                expandIcon={counted('arrow')}
                renderFullLabel={(row) => {
                    const { expandIcon } = row;
                    return (
                        <div class={row.class} data-icon={typeof expandIcon}>
                            {row.data.label}
                        </div>
                    );
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('Beijing');
    expect(created).toEqual([]);
});

it('tree/label 只接受文本，内容由 renderLabel 渲染', async () => {
    // @ts-expect-error a label is text, so search and the selection text can read it
    const data: TreeNodeData[] = [{ key: 'a', label: <b>a</b> }];
    expectTypeOf<Parameters<NonNullable<TreeProps['renderLabel']>>[0]>().toEqualTypeOf<string | number | undefined>();
    const { html, errors } = await renderServer({ render: () => <Tree treeData={treeData} renderLabel={(label) => <b>{label}</b>} /> });
    expect(errors).toEqual([]);
    expect(html).toMatch(/<b[^>]*>Asia<\/b>/);
    expect(data).toHaveLength(1);
});
