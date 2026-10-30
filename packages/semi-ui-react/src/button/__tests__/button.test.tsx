import { StrictMode, createRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconEdit } from '@fibrae/semi-icons-react';
import semiGlobal from '@fibrae/semi-ui-react/_utils/semi-global';
import IconButton from '@fibrae/semi-ui-react/icon-button';
import InputGroup from '@fibrae/semi-ui-react/input/input-group';
import Space from '@fibrae/semi-ui-react/space';
import ButtonGroup from '../button-group';
import Button, { type ButtonProps, type HtmlType } from '../index';
import SplitButtonGroup from '../split-button-group';

const prefixCls = `${BASE_CLASS_PREFIX}-button`;
function FillProbe({ fill }: { fill?: string | string[] }) {
    return <span data-fill={JSON.stringify(fill ?? null)} data-testid="icon" />;
}
const readFill = () => JSON.parse(screen.getByTestId('icon').dataset.fill);

describe('Button', () => {
    it('自定义 className 与 style 的 button', () => {
        render(<Button className="test" style={{ color: 'red' }} />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('test');
        expect(button).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it(`带 icon 的 button`, () => {
        const { container } = render(<Button icon={<IconEdit />} />);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
    });

    it(`水平内边距`, () => {
        const { unmount } = render(<Button noHorizontalPadding icon={<IconEdit />} />);
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '0px' });
        unmount();

        render(<Button noHorizontalPadding={['left', 'right']} icon={<IconEdit />} />);
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '0px' });
    });

    it(`loading 状态`, () => {
        const { container } = render(<Button loading icon={<IconEdit />} />);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);
    });

    it('button 类型', () => {
        const types: HtmlType[] = ['button', 'reset', 'submit'];
        for (const type of types) {
            const { unmount } = render(<Button htmlType={type} />);
            expect(screen.getByRole('button')).toHaveAttribute('type', type);
            unmount();
        }
    });

    it(`位置`, () => {
        const { container } = render(
            <Button iconPosition="right" icon={<IconEdit />}>
                text
            </Button>
        );
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-button-content-left`)).toHaveLength(1);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-button-content-right`)).toHaveLength(0);
    });

    it(`包含无效子元素的 button group`, () => {
        const { container } = render(
            <ButtonGroup>
                {false}
                {null}
                {undefined}
                {1}
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        );
        expect(container).toHaveTextContent('1查询剪切');
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('button group 末项为 false 时分隔线数量等于可见按钮数减一', () => {
        const hidden: boolean = true;
        const { container } = render(
            <ButtonGroup>
                <Button>a</Button>
                <Button>b</Button>
                {hidden ? null : <Button>c</Button>}
            </ButtonGroup>
        );
        expect(container.querySelectorAll(`.${prefixCls}-group-line`)).toHaveLength(1);
        expect(screen.getByRole('group').lastElementChild).toBe(screen.getByText('b').closest('button'));
    });

    it('button group 中嵌套数组里的按钮继承组的 disabled，且之间有分隔线', () => {
        const { container } = render(
            <ButtonGroup disabled>
                <Button>a</Button>
                {['b', 'c'].map((text) => (
                    <Button key={text}>{text}</Button>
                ))}
            </ButtonGroup>
        );
        screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
        expect(container.querySelectorAll(`.${prefixCls}-group-line`)).toHaveLength(2);
    });

    it('自定义 className 与 style 的 button group', () => {
        render(<ButtonGroup className="test" style={{ color: 'red' }} />);
        const group = screen.getByRole('group');
        expect(group).toHaveClass('test');
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('className 含 -with-icon 的普通 Button 仍有内容插槽标记', () => {
        render(<Button className="card-with-icon">text</Button>);
        expect(screen.getByText('text')).toHaveAttribute('x-semi-prop', 'children');
    });

    it('button group 的 ref 指向 role=group 根元素', () => {
        const ref = createRef<HTMLDivElement>();
        render(<ButtonGroup ref={ref} />);
        expect(ref.current).toBe(screen.getByRole('group'));
    });

    it('disabled 的 button 同时设置 disabled 与 aria-disabled，并切换类型类名', () => {
        render(
            <Button type="danger" disabled theme="solid">
                x
            </Button>
        );
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toHaveClass(`${prefixCls}-disabled`, `${prefixCls}-danger-disabled`, `${prefixCls}-solid`);
        expect(button).not.toHaveClass(`${prefixCls}-danger`);
    });

    it('disabled 的 button 内点击不冒泡到祖先元素', () => {
        const outer = vi.fn<React.MouseEventHandler>();
        const onClick = vi.fn<React.MouseEventHandler>();
        const { rerender } = render(
            <div role="presentation" onClick={outer}>
                <Button disabled onClick={onClick}>
                    text
                </Button>
            </div>
        );
        fireEvent.click(screen.getByText('text'));
        expect(onClick).not.toHaveBeenCalled();
        expect(outer).not.toHaveBeenCalled();

        rerender(
            <div role="presentation" onClick={outer}>
                <Button onClick={onClick}>text</Button>
            </div>
        );
        fireEvent.click(screen.getByText('text'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(outer).toHaveBeenCalledTimes(1);
    });

    it('x-semi-children-alias 为 children 插槽命名', () => {
        const { container, unmount } = render(<Button x-semi-children-alias="label">x</Button>);
        expect(container.querySelector(`.${prefixCls}-content`)).toHaveAttribute('x-semi-prop', 'label');
        expect(screen.getByRole('button')).not.toHaveAttribute('x-semi-children-alias');
        unmount();

        render(
            <Button x-semi-children-alias="label" icon={<IconEdit />}>
                x
            </Button>
        );
        const content = document.querySelector(`.${prefixCls}-content`);
        expect(content).not.toHaveAttribute('x-semi-prop');
        expect(content.querySelector('[x-semi-prop="label"]')).toHaveTextContent('x');
    });

    it('loading 时渲染 spinner，除非按钮为 disabled', () => {
        const { container, rerender } = render(<Button loading>x</Button>);
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-loading`, `${prefixCls}-with-icon`);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);

        rerender(
            <Button disabled loading>
                x
            </Button>
        );
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-with-icon`);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(0);
    });

    it('loading 时点击不触发 onClick，按钮标记 aria-disabled 且仍可聚焦', () => {
        const onClick = vi.fn<NonNullable<ButtonProps['onClick']>>();
        const { rerender } = render(
            <Button loading onClick={onClick}>
                x
            </Button>
        );
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toBeDisabled();

        rerender(
            <Button loading icon={<IconEdit />} onClick={onClick}>
                x
            </Button>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();

        rerender(<Button onClick={onClick}>x</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('loading 时键盘激活产生的 click 不冒泡到祖先', () => {
        const outer = vi.fn<() => void>();
        render(
            <Space onClick={outer}>
                <Button loading>x</Button>
            </Space>
        );
        fireEvent.click(screen.getByRole('button'));
        expect(outer).not.toHaveBeenCalled();
    });

    it('children 为 false 或空串时按钮是纯图标按钮，不渲染空的文字 span', () => {
        for (const children of [false, '']) {
            const { container, unmount } = render(<Button icon={<IconEdit />}>{children}</Button>);
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-with-icon-only`);
            expect(container.querySelector(`.${prefixCls}-content-right`)).toBeNull();
            unmount();
        }
    });

    it('colorful 图标使用多色或双色填充', () => {
        const { rerender } = render(<Button type="tertiary" colorful theme="solid" icon={<FillProbe />} />);
        expect(readFill()).toEqual([3, 2, 1, 0].map((level, i) => `var(--semi-button-colorful-multiple-fill-${i}, var(--semi-ai-general-5-${level}))`));

        rerender(<Button type="tertiary" disabled colorful theme="solid" icon={<FillProbe />} />);
        expect(readFill()).toEqual(Array(4).fill('var(--semi-color-disabled-text)'));

        rerender(<Button type="tertiary" colorful theme="outline" icon={<FillProbe />} />);
        expect(readFill()).toEqual(['var(--semi-button-colorful-fill-primary, var(--semi-color-ai-purple))', 'var(--semi-button-colorful-fill-secondary, var(--semi-color-text-0))']);

        rerender(<Button type="primary" colorful theme="solid" icon={<FillProbe />} />);
        expect(readFill()).toBeNull();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid', type: 'danger' } };
        try {
            const { unmount } = render(<Button>x</Button>);
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-danger`);
            unmount();
            render(<Button type="primary">x</Button>);
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-primary`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('button group 的属性作为默认值，子按钮自身的值优先', () => {
        render(
            <ButtonGroup type="danger" colorful size="small" theme="solid">
                <Button type="primary" theme="light">
                    a
                </Button>
                <Button>b</Button>
                <Button theme="outline">c</Button>
            </ButtonGroup>
        );
        const [a, b, c] = screen.getAllByRole('button');
        expect(a).toHaveClass(`${prefixCls}-primary`, `${prefixCls}-light`, `${prefixCls}-size-small`);
        expect(a).not.toHaveClass(`${prefixCls}-solid`);
        expect(b).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-solid`, `${prefixCls}-colorful`);
        expect(c).toHaveClass(`${prefixCls}-outline`);
        expect(c).not.toHaveClass(`${prefixCls}-solid`);
        const lines = document.querySelectorAll(`.${prefixCls}-group-line`);
        expect(lines).toHaveLength(2);
        expect(lines[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines[1]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('button group 的分隔符跟随 group 的默认值与 disabled', () => {
        render(
            <ButtonGroup type="danger" disabled theme="solid">
                <Button>a</Button>
                <Button>b</Button>
            </ButtonGroup>
        );
        const line = document.querySelector(`.${prefixCls}-group-line`);
        expect(line).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`, `${prefixCls}-group-line-disabled`);
    });

    it('InputGroup 里的 Button 读组的 size、disabled，自身的值优先', () => {
        render(
            <InputGroup disabled size="small">
                <Button>a</Button>
                <Button disabled={false} size="large">
                    b
                </Button>
            </InputGroup>
        );
        const [a, b] = screen.getAllByRole('button');
        expect(a).toBeDisabled();
        expect(a).toHaveClass(`${prefixCls}-size-small`);
        expect(b).toBeEnabled();
        expect(b).toHaveClass(`${prefixCls}-size-large`);
    });

    it('InputGroup 里的 button group：ButtonGroup 自己的值优先，分隔线与按钮的 disabled 一致', () => {
        render(
            <InputGroup disabled size="small">
                <ButtonGroup disabled={false}>
                    <Button>a</Button>
                    <Button>b</Button>
                </ButtonGroup>
                <ButtonGroup>
                    <Button>c</Button>
                    <Button>d</Button>
                </ButtonGroup>
            </InputGroup>
        );
        const buttons = screen.getAllByRole('button');
        expect(buttons.map((button) => (button as HTMLButtonElement).disabled)).toEqual([false, false, true, true]);
        for (const button of buttons) {
            expect(button).toHaveClass(`${prefixCls}-size-small`);
        }
        const [enabledLine, disabledLine] = document.querySelectorAll(`.${prefixCls}-group-line`);
        expect(enabledLine).not.toHaveClass(`${prefixCls}-group-line-disabled`);
        expect(disabledLine).toHaveClass(`${prefixCls}-group-line-disabled`);
    });

    it('button group 在 IconButton 之后也画分隔线，outline 与末项除外', () => {
        render(
            <ButtonGroup type="danger" theme="solid">
                <IconButton aria-label="a" icon={<i />} />
                <IconButton aria-label="b" theme="outline" icon={<i />} />
                <IconButton aria-label="c" icon={<i />} />
                <Button>d</Button>
            </ButtonGroup>
        );
        const lines = document.querySelectorAll(`.${prefixCls}-group-line`);
        expect(lines).toHaveLength(2);
        expect(lines[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
        expect(screen.getByRole('group').children[1]).toBe(lines[0]);
    });

    it('button group 在 IconButton 之后的分隔线读全局 IconButton 键', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { theme: 'solid', type: 'danger' } };
        try {
            render(
                <ButtonGroup>
                    <IconButton aria-label="a" icon={<i />} />
                    <Button>b</Button>
                </ButtonGroup>
            );
            const lines = document.querySelectorAll(`.${prefixCls}-group-line`);
            expect(lines).toHaveLength(1);
            expect(lines[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('button group 把其他属性与事件放在 group 根元素上，而非按钮上', () => {
        const onClick = vi.fn<React.MouseEventHandler>();
        render(
            <ButtonGroup id="g" data-foo="bar" aria-describedby="d" aria-label="actions" onClick={onClick}>
                <Button>a</Button>
            </ButtonGroup>
        );
        const group = screen.getByRole('group', { name: 'actions' });
        expect(group).toHaveAttribute('data-foo', 'bar');
        expect(group).toHaveAttribute('id', 'g');
        expect(group).toHaveAttribute('aria-describedby', 'd');
        const button = screen.getByRole('button');
        expect(button).not.toHaveAttribute('data-foo');
        expect(button).not.toHaveAttribute('aria-describedby');
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('outline 按钮后不绘制分隔符', () => {
        render(
            <ButtonGroup>
                <Button theme="outline">a</Button>
                <Button>b</Button>
                <Button disabled>c</Button>
            </ButtonGroup>
        );
        const lines = document.querySelectorAll(`.${prefixCls}-group-line`);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines[0]).not.toHaveClass(`${prefixCls}-group-line-disabled`);
    });

    it('无论是否带 icon，ref 都指向原生 button', () => {
        const ref = createRef<HTMLButtonElement>();
        const { rerender } = render(<Button ref={ref}>x</Button>);
        expect(ref.current).toBe(screen.getByRole('button'));
        rerender(<Button ref={ref} contentClassName="inner" icon={<IconEdit />} />);
        expect(ref.current).toBe(screen.getByRole('button'));
        expect(ref.current).not.toHaveAttribute('contentClassName');
        expect(document.querySelector(`.${prefixCls}-content`)).toHaveClass('inner');
    });

    it('split button group 将 ref 转发到根元素', () => {
        const ref = createRef<HTMLDivElement>();
        render(
            <SplitButtonGroup ref={ref} aria-label="split">
                <Button>a</Button>
            </SplitButtonGroup>
        );
        expect(ref.current).toBe(screen.getByRole('group', { name: 'split' }));
    });

    it('split button group 标记首尾按钮，子元素变化后同样生效', async () => {
        const { rerender } = render(
            <StrictMode>
                <SplitButtonGroup aria-label="split">
                    <Button>a</Button>
                    <Button>b</Button>
                </SplitButtonGroup>
            </StrictMode>
        );
        expect(screen.getByRole('group', { name: 'split' })).toHaveClass(`${prefixCls}-split`);
        const [a, b] = screen.getAllByRole('button');
        expect(a).toHaveClass(`${prefixCls}-first`);
        expect(b).toHaveClass(`${prefixCls}-last`);

        rerender(
            <StrictMode>
                <SplitButtonGroup aria-label="split">
                    <Button>a</Button>
                    <Button>b</Button>
                    <Button>c</Button>
                </SplitButtonGroup>
            </StrictMode>
        );
        await waitFor(() => expect(screen.getByText('c').closest('button')).toHaveClass(`${prefixCls}-last`));
        expect(b).not.toHaveClass(`${prefixCls}-last`);
    });

    it('loading 与 icon 切换时保留同一个原生 button 与焦点', () => {
        const { rerender } = render(<Button>save</Button>);
        const button = screen.getByRole('button');
        button.focus();
        for (const next of [{ loading: true }, { icon: <IconEdit /> }, {}] satisfies ButtonProps[]) {
            rerender(<Button {...next}>save</Button>);
            expect(screen.getByRole('button')).toBe(button);
            expect(button).toHaveFocus();
        }
    });

    it('colorful 按默认的 theme 与 type 选择 loading 图标与图标填充', () => {
        const { container, rerender } = render(
            <Button colorful loading>
                x
            </Button>
        );
        expect(container.querySelector(`.${prefixCls}-content-loading-icon`)).not.toBeNull();

        rerender(<Button colorful icon={<FillProbe />} />);
        expect(readFill()).toHaveLength(4);
    });

    it('无 icon 时 noHorizontalPadding 不落到原生 button', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <>
                <Button noHorizontalPadding="left">a</Button>
                <Button noHorizontalPadding>b</Button>
            </>
        );
        for (const button of screen.getAllByRole('button')) {
            expect(button).not.toHaveAttribute('nohorizontalpadding');
            expect(button).not.toHaveAttribute('noHorizontalPadding');
        }
        expect(error).not.toHaveBeenCalled();
    });

    it('button group 只把组值交给 Button 与 IconButton', () => {
        render(
            <ButtonGroup type="danger" disabled size="small" theme="solid">
                <span data-testid="span">x</span>
                <IconButton aria-label="edit" icon={<IconEdit />} />
            </ButtonGroup>
        );
        const span = screen.getByTestId('span');
        for (const name of ['type', 'theme', 'size', 'disabled']) {
            expect(span).not.toHaveAttribute(name);
        }
        const edit = screen.getByRole('button', { name: 'edit' });
        expect(edit).toBeDisabled();
        expect(edit).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-size-small`, `${prefixCls}-danger-disabled`);
    });

    it('button group 中子按钮显式传 undefined 时回落到组值', () => {
        render(
            <ButtonGroup type="danger" theme="solid">
                <Button type={undefined} theme={undefined}>
                    a
                </Button>
                <Button>b</Button>
            </ButtonGroup>
        );
        expect(screen.getByRole('button', { name: 'a' })).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-solid`);
        expect(document.querySelector(`.${prefixCls}-group-line`)).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('button group 的分隔线跟随全局 Button 默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid', type: 'danger' } };
        try {
            render(
                <ButtonGroup>
                    <Button>a</Button>
                    <Button>b</Button>
                </ButtonGroup>
            );
            expect(screen.getByRole('button', { name: 'a' })).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-danger`);
            expect(document.querySelector(`.${prefixCls}-group-line`)).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('不声明没有样式的 circle', () => {
        expectTypeOf<ButtonProps>().not.toHaveProperty('circle');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        // an undeclared prop on purpose: the removed circle must not produce the class any more
        render(<Button {...({ circle: true } as ButtonProps)}>x</Button>);
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-circle`);
    });

    it('disabled 优先于 loading：带 icon 的按钮也没有 loading 外观', () => {
        render(
            <Button disabled loading icon={<IconEdit />}>
                x
            </Button>
        );
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-loading`);
    });

    it('带 icon 的 Button 只读 Button 的全局默认值，IconButton 读自己的', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { theme: 'solid' } };
        try {
            render(
                <>
                    <Button aria-label="button" icon={<IconEdit />} />
                    <IconButton aria-label="icon-button" icon={<IconEdit />} />
                </>
            );
            const button = screen.getByRole('button', { name: 'button' });
            expect(button).toHaveClass(`${prefixCls}-light`);
            expect(button).not.toHaveClass(`${prefixCls}-solid`);
            expect(screen.getByRole('button', { name: 'icon-button' })).toHaveClass(`${prefixCls}-solid`);
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('split button group 移除末尾按钮后，新的末尾按钮标记为 last', async () => {
        const group = (labels: string[]) => (
            <SplitButtonGroup aria-label="split">
                {labels.map((label) => (
                    <Button key={label}>{label}</Button>
                ))}
            </SplitButtonGroup>
        );
        const { rerender } = render(group(['a', 'b', 'c']));
        rerender(group(['a', 'b']));
        const b = screen.getByText('b').closest('button');
        await waitFor(() => expect(b).toHaveClass(`${prefixCls}-last`));
    });
});
