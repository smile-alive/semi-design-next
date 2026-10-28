import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import Switch from '..';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('size 为 small 时不创建 checkedText 与 uncheckedText', async () => {
    const on = counter('on text');
    const off = counter('off text');
    const { html, errors } = await renderServer({ render: () => <Switch size="small" checkedText={<on.Counted />} uncheckedText={<off.Counted />} /> });
    expect(errors).toEqual([]);
    expect(html).not.toContain('on text');
    expect(html).not.toContain('off text');
    expect(on.state.created).toBe(0);
    expect(off.state.created).toBe(0);
});

it('只创建当前状态对应的文本', async () => {
    const on = counter('on text');
    const off = counter('off text');
    const { html } = await renderServer({ render: () => <Switch defaultChecked checkedText={<on.Counted />} uncheckedText={<off.Counted />} /> });
    expect(html).toContain('on text');
    expect(on.state.created).toBe(1);
    expect(off.state.created).toBe(0);
});
