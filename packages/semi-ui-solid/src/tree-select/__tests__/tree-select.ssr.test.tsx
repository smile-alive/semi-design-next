import { expect, expectTypeOf, it } from 'vite-plus/test';
import { renderServer, serverText } from '@test/solid/ssr.solid';
import TreeSelect, { type TreeSelectProps } from '..';

it('tree-select/treeData 的 label 只接受文本', async () => {
    // @ts-expect-error a label is text: the trigger shows it and search matches it
    const props: TreeSelectProps = { treeData: [{ key: 'a', value: 'a', label: <b>a</b> }] };
    expectTypeOf<Parameters<NonNullable<TreeSelectProps['renderLabel']>>[0]>().toEqualTypeOf<string | number | undefined>();
    const { html, errors } = await renderServer({ render: () => <TreeSelect treeData={[{ key: 'a', value: 'a', label: 'Asia' }]} value="a" /> });
    expect(errors).toEqual([]);
    expect(html).toContain('Asia');
    expect(props.treeData).toHaveLength(1);
});

it('tree-select/超出 maxTagCount 的标签不在首帧创建', async () => {
    const rendered: unknown[] = [];
    const treeData = [
        { label: 'Asia', value: 'Asia', key: '0', children: [{ label: 'Beijing', value: 'Beijing', key: '0-0' }] },
        { label: 'Europe', value: 'Europe', key: '1' },
    ];
    const { html, errors } = await renderServer({
        render: () => (
            <TreeSelect
                multiple
                maxTagCount={1}
                showRestTagsPopover
                treeData={treeData}
                defaultValue={['Beijing', 'Europe']}
                renderSelectedItem={(item) => {
                    rendered.push(item.value);
                    return { isRenderInTag: true, content: <span>{item.label}</span> };
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(serverText(html)).toContain('+1');
    expect(rendered).toEqual(['Europe']);
});

it('tree-select/triggerRender 接管触发器时不创建单选的已选内容', async () => {
    const rendered: unknown[] = [];
    const treeData = [{ label: 'Asia', value: 'Asia', key: '0' }];
    const renderSelectedItem = (item: { value?: unknown; label?: string | number }) => {
        rendered.push(item.value);
        return <span>{item.label}</span>;
    };
    const custom = await renderServer({ render: () => <TreeSelect treeData={treeData} value="Asia" renderSelectedItem={renderSelectedItem} triggerRender={(p) => <div>{p.value.length} picked</div>} /> });
    expect(custom.errors).toEqual([]);
    expect(serverText(custom.html)).toContain('1 picked');
    expect(rendered).toEqual([]);
    const builtIn = await renderServer({ render: () => <TreeSelect treeData={treeData} value="Asia" renderSelectedItem={renderSelectedItem} /> });
    expect(builtIn.errors).toEqual([]);
    expect(serverText(builtIn.html)).toContain('Asia');
    expect(rendered).toEqual(['Asia']);
});
