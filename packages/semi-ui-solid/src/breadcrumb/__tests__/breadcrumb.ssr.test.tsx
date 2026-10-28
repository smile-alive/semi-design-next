import { expect, it } from 'vite-plus/test';
import { renderServer, summarizeError } from '@test/solid/ssr.solid';
import Breadcrumb from '..';

it('非 Breadcrumb.Item 的元素与文本子项在服务端照常渲染', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Breadcrumb>
                <Breadcrumb.Item>Home</Breadcrumb.Item>
                <span>Plain element</span>
                Plain text
            </Breadcrumb>
        ),
    });
    expect(errors.map(summarizeError)).toEqual([]);
    expect(html).toContain('Plain element');
    expect(html).toContain('Plain text');
});

it('自定义省略号区域不创建被折叠的项', async () => {
    const created: string[] = [];
    const counted = (name: string) => () => {
        created.push(name);
        return name;
    };
    const [A, B, C, D, E] = ['a', 'b', 'c', 'd', 'e'].map(counted);
    const { html, errors } = await renderServer({
        render: () => (
            <Breadcrumb maxItemCount={3} renderMore={(rest) => <span>{`${rest.length} more`}</span>}>
                <Breadcrumb.Item>
                    <A />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <B />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <C />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <D />
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <E />
                </Breadcrumb.Item>
            </Breadcrumb>
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toContain('2 more');
    expect(created).toEqual(['a', 'd', 'e']);
});
