import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import { Copyable } from '../copyable';
import type { CopyableConfig } from '../interface';
import Numeral from '../numeral';

function counter(text: string) {
    const state = { created: 0 };
    const Counted = () => {
        state.created += 1;
        return text;
    };
    return { state, Counted };
}

it('Copyable 提供 render 时不调用 icon', async () => {
    const icon = counter('icon text');
    const { html, errors } = await renderServer({ render: () => <Copyable content="x" icon={() => <icon.Counted />} render={() => 'custom copy'} /> });
    expect(errors).toEqual([]);
    expect(html).toContain('custom copy');
    expect(html).not.toContain('icon text');
    expect(icon.state.created).toBe(0);
});

it('Copyable 默认视图只调用一次 icon，不调用 successTip', async () => {
    const icon = counter('icon text');
    const success = counter('success text');
    const { html } = await renderServer({ render: () => <Copyable content="x" icon={() => <icon.Counted />} successTip={() => <success.Counted />} /> });
    expect(html).toContain('icon text');
    expect(icon.state.created).toBe(1);
    expect(success.state.created).toBe(0);
});

it('服务端 Numeral 只格式化字符串 children，元素原样输出', async () => {
    const { html, errors } = await renderServer({
        render: () => (
            <Numeral precision={1}>
                2.345 <b>1.234</b>
            </Numeral>
        ),
    });
    expect(errors).toEqual([]);
    expect(html).toMatch(/>2\.3 <b[^>]*>1\.234<\/b>/);
});

it('服务端 copyable 以字符串 copyTip 命名按钮，图标的 aria-label 不参与命名', async () => {
    const { html } = await renderServer({ render: () => <Copyable content="x" copyTip="Copy code" icon={() => <i aria-label="Gear" />} /> });
    expect(html).toContain('aria-label="Copy code"');
    expect(html).not.toMatch(/<button[^>]*aria-label="Gear"/);
});

it('copyable 配置里的节点只能是渲染函数', () => {
    // type-only: a node in the config is created whenever the object literal is evaluated
    const typeOnly = (): CopyableConfig => ({
        // @ts-expect-error nodes are render functions
        icon: <span />,
        // @ts-expect-error nodes are render functions
        copyTip: <span />,
        // @ts-expect-error nodes are render functions
        successTip: <span />,
    });
    expect(typeOnly).toBeTypeOf('function');
});
