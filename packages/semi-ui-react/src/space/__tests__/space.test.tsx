import { createRef, useEffect } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import Space, { type SpaceProps } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-space`;

function renderSpace(spacing: SpaceProps['spacing']) {
    const { container, unmount } = render(
        <Space spacing={spacing}>
            {Array.from(Array(5)).map((_i, idx) => (
                <div key={idx}>content</div>
            ))}
        </Space>
    );
    const space = container.querySelector(`.${BASE_CLASS_PREFIX}-space`);
    return [space, unmount] as const;
}

const getSpace = (container: HTMLElement) => container.querySelector<HTMLElement>(`.${prefixCls}`);

describe('Space', () => {
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
        const { container } = render(
            <Space style={{ columnGap: 4 }} spacing={20}>
                x
            </Space>
        );
        expect(getSpace(container)).toHaveStyle({ columnGap: '4px', rowGap: '20px' });
        const arr = render(
            <Space style={{ rowGap: 3 }} spacing={[10, 20]}>
                x
            </Space>
        );
        expect(getSpace(arr.container)).toHaveStyle({ columnGap: '10px', rowGap: '3px' });
    });

    it('spacing 数组必须是两个元素的元组', () => {
        // @ts-expect-error a one-element array leaves the vertical axis without any gap
        const one: SpaceProps['spacing'] = [8];
        const two: SpaceProps['spacing'] = [8, 'loose'];
        expect([one, two]).toHaveLength(2);
    });

    it('渲染子元素', () => {
        const { container } = render(
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
        );
        expect(container.querySelector(`.${BASE_CLASS_PREFIX}-space`).children).toHaveLength(5);
    });

    it('条件兄弟切换时，后面有状态的子组件不重新挂载', () => {
        const mounted = vi.fn<() => void>();
        const Stateful = () => {
            useEffect(() => {
                mounted();
            }, []);
            return <input />;
        };
        const App = ({ show }: { show: boolean }) => (
            <Space>
                {show && <span>cond</span>}
                <Stateful />
            </Space>
        );
        const { rerender } = render(<App show />);
        rerender(<App show={false} />);
        rerender(<App show />);
        expect(mounted).toHaveBeenCalledTimes(1);
    });

    it('不同数组中的同名 key 不冲突', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <Space>
                {[<i key="a" />]}
                {[<b key="a" />]}
            </Space>
        );
        expect(error).not.toHaveBeenCalled();
        error.mockRestore();
    });

    it('默认为水平、居中、不换行的 space，并渲染 children 插槽', () => {
        const { container } = render(<Space>content</Space>);
        const space = getSpace(container);
        expect(space).toHaveClass(`${prefixCls}-horizontal`, `${prefixCls}-align-center`);
        expect(space).not.toHaveClass(`${prefixCls}-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-wrap`);
        expect(space).toHaveAttribute('x-semi-prop', 'children');
        expect(space).toHaveTextContent('content');
    });

    it('align 和 vertical 设置对应类名', () => {
        for (const align of ['start', 'center', 'end', 'baseline'] as const) {
            const { container, unmount } = render(<Space align={align} vertical />);
            const space = getSpace(container);
            expect(space).toHaveClass(`${prefixCls}-align-${align}`, `${prefixCls}-vertical`);
            expect(space).not.toHaveClass(`${prefixCls}-horizontal`);
            unmount();
        }
    });

    it('wrap 仅对水平 space 生效', () => {
        const { container, rerender } = render(<Space wrap />);
        expect(getSpace(container)).toHaveClass(`${prefixCls}-wrap`);
        rerender(<Space vertical wrap />);
        expect(getSpace(container)).not.toHaveClass(`${prefixCls}-wrap`);
    });

    it('混合间距数组在一个轴上使用类名，另一个轴上使用 gap', () => {
        const { container, rerender } = render(<Space spacing={['loose', 12]} />);
        let space = getSpace(container);
        expect(space).toHaveClass(`${prefixCls}-loose-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-loose-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-tight-vertical`);
        expect(space).toHaveStyle({ rowGap: '12px' });
        rerender(<Space spacing={[8, 'medium']} />);
        space = getSpace(container);
        expect(space).toHaveClass(`${prefixCls}-medium-vertical`);
        expect(space).not.toHaveClass(`${prefixCls}-medium-horizontal`);
        expect(space).not.toHaveClass(`${prefixCls}-tight-horizontal`);
        expect(space).toHaveStyle({ columnGap: '8px' });
    });

    it('className 和 style 与生成的类名和 gap 合并', () => {
        const { container } = render(<Space className="custom" style={{ color: 'red' }} spacing={6} />);
        const space = getSpace(container);
        expect(space).toHaveClass(prefixCls, 'custom');
        expect(space).toHaveStyle({ color: 'rgb(255, 0, 0)', columnGap: '6px', rowGap: '6px' });
    });

    it('data 属性透传到根元素', () => {
        const { container } = render(<Space data-testid="space" data-x="1" />);
        expect(getSpace(container)).toHaveAttribute('data-x', '1');
        expect(getSpace(container)).toHaveAttribute('data-testid', 'space');
    });

    it('其他未知属性透传到根元素', () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        const rootAttrs = { id: 'space', 'aria-label': 'toolbar', onClick };
        const { container } = render(<Space {...rootAttrs} />);
        const space = getSpace(container);
        expect(space).toHaveAttribute('id', 'space');
        expect(space).toHaveAttribute('aria-label', 'toolbar');
        space.click();
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('ref 指向根元素', () => {
        const ref = createRef<HTMLDivElement>();
        const { container } = render(<Space ref={ref} />);
        expect(ref.current).toBe(getSpace(container));
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Space: { vertical: true, spacing: 'loose' } };
        try {
            const { container } = render(<Space spacing="medium" />);
            const space = getSpace(container);
            expect(space).toHaveClass(`${prefixCls}-vertical`, `${prefixCls}-medium-horizontal`);
            expect(space).not.toHaveClass(`${prefixCls}-loose-horizontal`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });
});
