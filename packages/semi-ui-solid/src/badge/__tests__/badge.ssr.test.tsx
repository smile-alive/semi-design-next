import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Badge from '..';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('dot 为 true 时不创建 count', async () => {
    const count = counter('count text');
    const { html, errors } = await renderServer({ render: () => <Badge dot count={<count.Counted />} /> });
    expect(errors).toEqual([]);
    expect(html).not.toContain('count text');
    expect(count.state.created).toBe(0);
});

it('非 dot 时创建一次 count', async () => {
    const count = counter('count text');
    const { html } = await renderServer({ render: () => <Badge count={<count.Counted />} /> });
    expect(html).toContain('count text');
    expect(count.state.created).toBe(1);
});
