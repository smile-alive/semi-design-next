import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Transfer from '..';

it('transfer/renderLabel 在每个插入处各创建一次', async () => {
    const rendered: string[] = [];
    const { html, errors } = await renderServer({
        render: () => (
            <Transfer
                dataSource={[
                    { label: 'Apple', value: 'a', key: 'a' },
                    { label: 'Banana', value: 'b', key: 'b' },
                ]}
                defaultValue={['a']}
                renderLabel={(item) => {
                    rendered.push(String(item.key));
                    return <b>{item.label}</b>;
                }}
            />
        ),
    });
    expect(errors).toEqual([]);
    expect(html.match(/<b[\s>]/g)).toHaveLength(3);
    // both lists show the selected item
    expect(rendered.toSorted((x, y) => x.localeCompare(y))).toEqual(['a', 'a', 'b']);
});
