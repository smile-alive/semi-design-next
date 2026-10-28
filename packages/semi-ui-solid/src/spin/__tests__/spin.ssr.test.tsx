import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Spin from '..';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('spinning 为 false 时不创建 tip 与 indicator', async () => {
    const tip = counter('tip text');
    const indicator = counter('indicator text');
    const { html, errors } = await renderServer({ render: () => <Spin spinning={false} tip={<tip.Counted />} indicator={<indicator.Counted />} /> });
    expect(errors).toEqual([]);
    expect(html).not.toContain('tip text');
    expect(html).not.toContain('indicator text');
    expect(tip.state.created).toBe(0);
    expect(indicator.state.created).toBe(0);
});

it('spinning 时各创建一次', async () => {
    const tip = counter('tip text');
    const indicator = counter('indicator text');
    const { html } = await renderServer({ render: () => <Spin tip={<tip.Counted />} indicator={<indicator.Counted />} /> });
    expect(html).toContain('tip text');
    expect(html).toContain('indicator text');
    expect(tip.state.created).toBe(1);
    expect(indicator.state.created).toBe(1);
});
