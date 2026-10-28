import { createSignal, For, onMount, Show } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Space, { type SpaceProps } from '..';
import semiGlobal from '../../_utils/semi-global';

const prefixCls = `${BASE_CLASS_PREFIX}-space`;

const renderSpace = (spacing: SpaceProps['spacing']) => {
    const { container, unmount } = render(() => (
        <Space spacing={spacing}>
            <For each={Array.from(Array(5))}>{() => <div>content</div>}</For>
        </Space>
    ));
    return [container.querySelector(`.${prefixCls}`) as HTMLElement, unmount] as const;
};

const getSpace = (container: HTMLElement) => container.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;

describe('Space', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('间距', () => {
        const classCases: [SpaceProps['spacing'], string, string][] = [
            [undefined, 'semi-space-tight-horizontal', 'semi-space-tight-vertical'],
            ['loose', 'semi-space-loose-horizontal', 'semi-space-loose-vertical'],
            ['medium', 'semi-space-medium-horizontal', 'semi-space-medium-vertical'],
            ['tight', 'semi-space-tight-horizontal', 'semi-space-tight-vertical'],
            [['tight', 'loose'], 'semi-space-tight-horizontal', 'semi-space-loose-vertical'],
        ];
        for (const [spacing, horizontalCls, verticalCls] of classCases) {
            const [space, unmount] = renderSpace(spacing);
            expect(space).toHaveClass(horizontalCls, verticalCls);
            unmount();
        }

        const styleCases: [SpaceProps['spacing'], string, string][] = [
            [20, '20px', '20px'],
            [[10, 20], '10px', '20px'],
        ];
        for (const [spacing, columnGap, rowGap] of styleCases) {
            const [space, unmount] = renderSpace(spacing);
            expect(space).toHaveStyle({ columnGap, rowGap });
            unmount();
        }
    });

    it('用户 style 的 gap 优先于数字 spacing', () => {
        const { container } = render(() => (
            <Space style={{ 'column-gap': '4px' }} spacing={20}>
                x
            </Space>
        ));
        expect(getSpace(container)).toHaveStyle({ columnGap: '4px', rowGap: '20px' });
        // Solid accepts a string style; the lint rule only allows the object form in JSX literals
        const ownStyle = { style: 'row-gap: 3px' };
        const arr = render(() => (
            <Space {...ownStyle} spacing={[10, 20]}>
                x
            </Space>
        ));
        expect(getSpace(arr.container)).toHaveStyle({ columnGap: '10px', rowGap: '3px' });
    });

    it('spacing 数组必须是两个元素的元组', () => {
        // @ts-expect-error a one-element array leaves the vertical axis without any gap
        const one: SpaceProps['spacing'] = [8];
        const two: SpaceProps['spacing'] = [8, 'loose'];
        expect([one, two]).toHaveLength(2);
    });

    it('渲染子元素', () => {
        const { container } = render(() => (
            <Space>
                <div>content</div>
                {null}
                <div>content</div>
                {false}
                <div>content</div>
                {undefined}
                <>
                    <div>content</div>
                    <div>content</div>
                </>
            </Space>
        ));
        expect(getSpace(container).children).toHaveLength(5);
    });

    it('条件兄弟切换时，后面有状态的子组件不重新挂载', () => {
        const mounted = vi.fn<() => void>();
        const Stateful = () => {
            onMount(mounted);
            return <input />;
        };
        const [show, setShow] = createSignal(true);
        render(() => (
            <Space>
                <Show when={show()}>
                    <span>cond</span>
                </Show>
                <Stateful />
            </Space>
        ));
        setShow(false);
        setShow(true);
        expect(mounted).toHaveBeenCalledTimes(1);
    });

    it('默认为水平、居中、不换行的 space，并渲染 children 插槽', () => {
        const { container } = render(() => <Space>content</Space>);
        const space = getSpace(container);
        expect(space).toHaveClass(`${prefixCls}-horizontal`, `${prefixCls}-align-center`);
        expect(space).not.toHaveClass(`${prefixCls}-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-wrap`);
        expect(space).toHaveAttribute('x-semi-prop', 'children');
        expect(space).toHaveTextContent('content');
    });

    it('align 和 vertical 设置对应类名', () => {
        for (const align of ['start', 'center', 'end', 'baseline'] as const) {
            const { container, unmount } = render(() => <Space align={align} vertical />);
            const space = getSpace(container);
            expect(space).toHaveClass(`${prefixCls}-align-${align}`, `${prefixCls}-vertical`);
            expect(space).not.toHaveClass(`${prefixCls}-horizontal`);
            unmount();
        }
    });

    it('wrap 仅对水平 space 生效', () => {
        const [vertical, setVertical] = createSignal(false);
        const { container } = render(() => <Space wrap vertical={vertical()} />);
        expect(getSpace(container)).toHaveClass(`${prefixCls}-wrap`);
        setVertical(true);
        expect(getSpace(container)).not.toHaveClass(`${prefixCls}-wrap`);
    });

    it('混合间距数组在一个轴上使用类名，另一个轴上使用 gap', () => {
        const [spacing, setSpacing] = createSignal<SpaceProps['spacing']>(['loose', 12]);
        const { container } = render(() => <Space spacing={spacing()} />);
        let space = getSpace(container);
        expect(space).toHaveClass(`${prefixCls}-loose-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-loose-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-tight-vertical`);
        expect(space).toHaveStyle({ rowGap: '12px' });
        setSpacing([8, 'medium']);
        space = getSpace(container);
        expect(space).toHaveClass(`${prefixCls}-medium-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-medium-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-tight-horizontal`);
        expect(space).toHaveStyle({ columnGap: '8px' });
    });

    it('class 和 style 与生成的类名和 gap 合并', () => {
        const { container } = render(() => <Space class="custom" style={{ color: 'red' }} spacing={6} />);
        const space = getSpace(container);
        expect(space).toHaveClass(prefixCls, 'custom');
        expect(space).toHaveStyle({ color: 'rgb(255, 0, 0)', columnGap: '6px', rowGap: '6px' });
    });

    it('data 属性透传到根元素', () => {
        const { container } = render(() => <Space data-testid="space" data-x="1" />);
        expect(getSpace(container)).toHaveAttribute('data-x', '1');
        expect(getSpace(container)).toHaveAttribute('data-testid', 'space');
    });

    it('其他未知属性透传到根元素', () => {
        const onClick = vi.fn<() => void>();
        const { container } = render(() => <Space id="space" aria-label="toolbar" onClick={onClick} />);
        const space = getSpace(container);
        expect(space).toHaveAttribute('id', 'space');
        expect(space).toHaveAttribute('aria-label', 'toolbar');
        space.click();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('ref 指向根元素', () => {
        let ref: HTMLDivElement | undefined;
        const { container } = render(() => <Space ref={(node) => (ref = node)} />);
        expect(ref).toBe(getSpace(container));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Space: { vertical: true, spacing: 'loose' } } as typeof semiGlobal.config.overrideDefaultProps;
        const { container } = render(() => <Space spacing="medium" />);
        const space = getSpace(container);
        expect(space).toHaveClass(`${prefixCls}-vertical`, `${prefixCls}-medium-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-loose-horizontal`);
    });
});
