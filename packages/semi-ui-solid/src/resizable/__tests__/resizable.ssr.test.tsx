import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import { Resizable } from '..';

it('enable 关闭的方向不创建手柄内容', async () => {
    let created = 0;
    const Counted = () => {
        created += 1;
        return <b>grip</b>;
    };
    const { html, errors } = await renderServer({
        render: () => (
            <Resizable defaultSize={{ width: 200, height: 100 }} enable={{ left: false }} renderHandle={(direction) => (direction === 'left' ? <Counted /> : undefined)}>
                body
            </Resizable>
        ),
    });
    expect(errors).toEqual([]);
    expect(html).not.toContain('grip');
    expect(created).toBe(0);
});
