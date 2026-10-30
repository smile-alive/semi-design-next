/** @jsxImportSource vue */
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import FloatButtonGroup from '../float-button-group.vue';
import FloatButton from '../float-button.vue';

const prefixCls = 'semi-floatButton';
const groupCls = 'semi-floatButtonGroup';

function rectOf(el: Element) {
    const { x, y, width, height } = el.getBoundingClientRect();
    return { x, y, width, height };
}
const icon = () => <i>i</i>;

describe('FloatButton 布局与样式', () => {
    it('在所有尺寸下，无论是否有 badge，主体都填满根元素', () => {
        const view = render(() => (
            <div>
                <FloatButton style={{ bottom: '300px' }} size="small">
                    {{ icon }}
                </FloatButton>
                <FloatButton style={{ bottom: '200px' }}>{{ icon }}</FloatButton>
                <FloatButton style={{ bottom: '100px' }} badge={{ count: 5 }} shape="square" size="large">
                    {{ icon }}
                </FloatButton>
                <FloatButton style={{ bottom: '20px' }} badge={{ dot: true }}>
                    {{ icon }}
                </FloatButton>
            </div>
        ));
        const roots = view.container.querySelectorAll(`.${prefixCls}`);
        [24, 32, 40, 32].forEach((size, index) => {
            const root = roots[index];
            const body = root.querySelector(`.${prefixCls}-body`) as Element;
            expect(rectOf(root)).toMatchObject({ width: size, height: size });
            expect(rectOf(body)).toEqual(rectOf(root));
        });
    });

    it('根元素没有浏览器默认的按钮或链接样式', () => {
        const view = render(FloatButton, { props: { shape: 'square' }, slots: { icon } });
        const style = getComputedStyle(view.container.querySelector(`.${prefixCls}`) as Element);
        expect(style.paddingTop).toBe('0px');
        expect(style.paddingLeft).toBe('0px');
        expect(style.borderTopWidth).toBe('0px');
        expect(style.marginTop).toBe('0px');
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.textDecorationLine).toBe('none');
        expect(style.cursor).toBe('pointer');
        expect(style.borderTopLeftRadius).toBe('8px');
        expect(style.position).toBe('fixed');
    });
});

describe('FloatButtonGroup 布局与样式', () => {
    it('每个项使用分组项样式渲染，且没有浏览器默认按钮样式', () => {
        const view = render(() => (
            <div>
                <span style={{ color: 'var(--semi-color-text-0)' }} data-testid="text-0" />
                <FloatButtonGroup
                    items={[
                        { content: 'Editor', value: 'editor' },
                        { content: 'Search', value: 'search' },
                    ]}
                >
                    {{ icon }}
                </FloatButtonGroup>
            </div>
        ));
        const root = view.container.querySelector(`.${groupCls}`) as Element;
        const item = root.querySelector(`.${groupCls}-item`) as Element;
        const style = getComputedStyle(item);
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.borderTopWidth).toBe('0px');
        expect(style.marginTop).toBe('0px');
        expect(style.padding).toBe('6px 12px');
        expect(style.fontFamily).toBe(getComputedStyle(root).fontFamily);
        expect(style.fontSize).toBe('14px');
        expect(style.fontWeight).toBe('400');
        expect(style.lineHeight).toBe('20px');
        expect(style.textDecorationLine).toBe('none');
        expect(style.cursor).toBe('pointer');
        expect(style.borderTopLeftRadius).toBe('4px');
        expect(style.color).toBe(getComputedStyle(screen.getByTestId('text-0')).color);
        expect(rectOf(item).height).toBe(32);
        expect(rectOf(root).height).toBe(44);
    });

    it('分组项在相同属性下具有与独立 FloatButton 相同的形状、尺寸和彩色外观', () => {
        render(() => (
            <div>
                <FloatButton aria-label="alone" colorful shape="square" size="large">
                    {{ icon }}
                </FloatButton>
                <FloatButtonGroup items={[{ shape: 'square', size: 'large', colorful: true, 'aria-label': 'grouped' }]}>{{ icon }}</FloatButtonGroup>
            </div>
        ));
        const alone = getComputedStyle((screen.getByRole('button', { name: 'alone' }) as Element).firstElementChild as Element);
        const item = screen.getByRole('button', { name: 'grouped' });
        const grouped = getComputedStyle(item);
        expect(grouped.backgroundImage).toBe(alone.backgroundImage);
        expect(grouped.backgroundImage).not.toBe('none');
        expect(grouped.color).toBe(alone.color);
        expect(grouped.borderTopLeftRadius).toBe(alone.borderTopLeftRadius);
        expect(rectOf(item).width).toBe(parseFloat(alone.width));
        expect(rectOf(item).height).toBe(parseFloat(alone.height));
    });

    it('禁用项变暗，且没有悬停背景', async () => {
        render(() => (
            <div>
                <span style={{ color: 'var(--semi-color-disabled-text)' }} data-testid="disabled-text" />
                <FloatButtonGroup disabled items={[{ content: 'Editor', value: 'editor' }]} />
            </div>
        ));
        const item = screen.getByRole('button', { name: 'Editor' });
        await userEvent.hover(item);
        const style = getComputedStyle(item);
        expect(style.color).toBe(getComputedStyle(screen.getByTestId('disabled-text')).color);
        expect(style.cursor).toBe('not-allowed');
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('分组宽度不足时文字项保持单行原宽，不按字换行', () => {
        const items = [
            { content: '复制链接', value: 'copy' },
            { content: '回到顶部', value: 'top' },
            { content: '意见反馈', value: 'feedback' },
        ];
        const view = render(() => (
            <div>
                <FloatButtonGroup items={items} style={{ width: '600px' }}>
                    {{ icon }}
                </FloatButtonGroup>
                <FloatButtonGroup items={items} style={{ width: '120px' }}>
                    {{ icon }}
                </FloatButtonGroup>
            </div>
        ));
        const [roomy, narrow] = [...view.container.querySelectorAll(`.${groupCls}`)].map((group) => rectOf(group.querySelector(`.${groupCls}-item`) as Element));
        expect({ width: narrow.width, height: narrow.height }).toEqual({ width: roomy.width, height: roomy.height });
    });
});

describe('FloatButton 键盘操作', () => {
    it('可通过 Tab 访问按钮和链接，并用 Enter 与 Space 激活', async () => {
        const onClick = vi.fn<(name: string) => void>();
        const onGroupClick = vi.fn<(value: string | undefined, event: MouseEvent) => void>();
        render(() => (
            <div>
                <button data-testid="start">start</button>
                <FloatButton aria-label="Edit" onClick={() => onClick('edit')}>
                    {{ icon }}
                </FloatButton>
                <FloatButton aria-label="Off" disabled onClick={() => onClick('off')}>
                    {{ icon }}
                </FloatButton>
                <FloatButton
                    aria-label="Docs"
                    href="#docs"
                    onClick={(event: MouseEvent) => {
                        event.preventDefault();
                        onClick('docs');
                    }}
                />
                <FloatButtonGroup
                    items={[
                        { content: 'Editor', value: 'editor' },
                        { content: 'Search', value: 'search', disabled: true },
                        { content: 'Help', value: 'help' },
                    ]}
                    onClick={onGroupClick}
                />
            </div>
        ));
        await userEvent.click(screen.getByTestId('start'));

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit' }));
        expect(getComputedStyle(document.activeElement as Element).outlineStyle).toBe('solid');
        expect(getComputedStyle(document.activeElement as Element).outlineWidth).toBe('2px');
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard(' ');
        expect(onClick.mock.calls).toEqual([['edit'], ['edit']]);

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Docs' }));
        await userEvent.keyboard('{Enter}');
        expect(onClick.mock.calls.at(-1)).toEqual(['docs']);

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Editor' }));
        await userEvent.keyboard(' ');
        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Help' }));
        await userEvent.keyboard('{Enter}');
        expect(onGroupClick.mock.calls.map(([value]) => value)).toEqual(['editor', 'help']);
    });
});
