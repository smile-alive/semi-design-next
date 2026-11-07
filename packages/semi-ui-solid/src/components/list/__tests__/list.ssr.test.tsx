import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import List from '..';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('有数据时不创建 emptyContent', async () => {
    const empty = counter('empty text');
    const { html, errors } = await renderServer({ render: () => <List dataSource={['a']} emptyContent={<empty.Counted />} renderItem={(item) => <List.Item>{item}</List.Item>} /> });
    expect(errors).toEqual([]);
    expect(html).not.toContain('empty text');
    expect(empty.state.created).toBe(0);
});

it('无数据时创建一次 emptyContent', async () => {
    const empty = counter('empty text');
    const { html } = await renderServer({ render: () => <List dataSource={[]} emptyContent={<empty.Counted />} /> });
    expect(html).toContain('empty text');
    expect(empty.state.created).toBe(1);
});
