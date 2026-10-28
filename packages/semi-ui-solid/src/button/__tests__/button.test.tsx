import { For, Show, createSignal } from 'solid-js';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { type IconFill, IconAIEditLevel2, IconEdit } from '@fibrae/semi-icons-solid';
import { PopupLayerContext } from '../../_base/popup-layer';
import semiGlobal, { type OverrideDefaultProps } from '../../_utils/semi-global';
import IconButton from '../../icon-button';
import Button, { type ButtonProps, type HtmlType, type Theme, type Type, ButtonGroup } from '../index';

const prefixCls = `${BASE_CLASS_PREFIX}-button`;
type Handler = (event: MouseEvent) => void;
const FillProbe = (props: { fill?: IconFill }) => <span data-fill={JSON.stringify(props.fill ?? null)} data-testid="icon" />;
const readFill = (): unknown => JSON.parse(screen.getByTestId('icon').dataset.fill ?? 'null');
const lines = () => document.querySelectorAll(`.${prefixCls}-group-line`);
const multiple = [3, 2, 1, 0].map((level, i) => `var(--semi-button-colorful-multiple-fill-${i}, var(--semi-ai-general-5-${level}))`);

describe('Button', () => {
    let saved: OverrideDefaultProps | undefined;

    beforeEach(() => {
        saved = semiGlobal.config.overrideDefaultProps;
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = saved;
    });

    it('自定义 class 与 style 的 button', () => {
        render(() => <Button class="test" style={{ color: 'red' }} />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('test', prefixCls);
        expect(button).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 icon 的 button', () => {
        const { container } = render(() => <Button icon={<IconEdit />} />);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-with-icon`, `${prefixCls}-with-icon-only`);
    });

    it('水平内边距，布尔与数组都生效', () => {
        const view = render(() => <Button noHorizontalPadding icon={<IconEdit />} />);
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '0px' });
        view.unmount();
        render(() => <Button noHorizontalPadding={['left', 'right']} icon={<IconEdit />} />);
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '0px' });
    });

    it('loading 状态用 spinner 替换 icon', () => {
        const { container } = render(() => <Button loading icon={<IconEdit />} />);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(0);
    });

    it('button 类型', () => {
        const types: HtmlType[] = ['button', 'reset', 'submit'];
        for (const htmlType of types) {
            const view = render(() => <Button htmlType={htmlType} />);
            expect(screen.getByRole('button')).toHaveAttribute('type', htmlType);
            view.unmount();
        }
    });

    it('icon 为 Show 时随条件显示图标与 icon 布局', () => {
        const [flag, setFlag] = createSignal(false);
        const { container } = render(() => (
            <Button
                icon={
                    <Show when={flag()}>
                        <IconEdit />
                    </Show>
                }
            >
                x
            </Button>
        ));
        const button = screen.getByRole('button');
        expect(button).not.toHaveClass(`${prefixCls}-with-icon`);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(0);
        setFlag(true);
        expect(button).toHaveClass(`${prefixCls}-with-icon`);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
        setFlag(false);
        expect(button).not.toHaveClass(`${prefixCls}-with-icon`);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(0);
    });

    it('iconPosition 为 right 时文字在前', () => {
        const { container } = render(() => (
            <Button iconPosition="right" icon={<IconEdit />}>
                x
            </Button>
        ));
        expect(container.querySelectorAll(`.${prefixCls}-content-left`)).toHaveLength(1);
        expect(container.querySelectorAll(`.${prefixCls}-content-right`)).toHaveLength(0);
        expect(container.querySelector(`.${prefixCls}-content`)?.firstElementChild).toHaveTextContent('x');
    });

    it('iconPosition 变化时调换图标与文字的顺序', () => {
        const [position, setPosition] = createSignal<'left' | 'right'>('left');
        const { container } = render(() => (
            <Button iconPosition={position()} icon={<IconEdit />}>
                x
            </Button>
        ));
        const content = container.querySelector(`.${prefixCls}-content`) as HTMLElement;
        expect(content.lastElementChild).toHaveClass(`${prefixCls}-content-right`);
        setPosition('right');
        expect(content.firstElementChild).toHaveClass(`${prefixCls}-content-left`);
        expect(content.lastElementChild).toHaveClass(`${BASE_CLASS_PREFIX}-icon-edit`);
    });

    it('包含无效子元素的 button group', () => {
        const { container } = render(() => (
            <ButtonGroup>
                {false}
                {null}
                {undefined}
                {1}
                <Button>查询</Button>
                <Button>剪切</Button>
            </ButtonGroup>
        ));
        expect(container).toHaveTextContent('1查询剪切');
        expect(screen.getAllByRole('button')).toHaveLength(2);
        expect(lines()).toHaveLength(1);
    });

    it('button group 末项被 Show 隐藏时分隔线数量等于可见按钮数减一', () => {
        const [showLast, setShowLast] = createSignal(false);
        render(() => (
            <ButtonGroup>
                <Button>a</Button>
                <Button>b</Button>
                <Show when={showLast()}>
                    <Button>c</Button>
                </Show>
            </ButtonGroup>
        ));
        expect(lines()).toHaveLength(1);
        expect(screen.getByRole('group').lastElementChild).toBe(screen.getByRole('button', { name: 'b' }));
        setShowLast(true);
        expect(lines()).toHaveLength(2);
        expect(screen.getByRole('group').lastElementChild).toBe(screen.getByRole('button', { name: 'c' }));
    });

    it('button group 中 For 生成的按钮继承组的 disabled，且之间有分隔线', () => {
        render(() => (
            <ButtonGroup disabled>
                <Button>a</Button>
                <For each={['b', 'c']}>{(text) => <Button>{text}</Button>}</For>
            </ButtonGroup>
        ));
        screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
        expect(lines()).toHaveLength(2);
    });

    it('button group 在 IconButton 之后也画分隔线，outline 与末项除外', () => {
        render(() => (
            <ButtonGroup type="danger" theme="solid">
                <IconButton aria-label="a" icon={<IconEdit />} />
                <IconButton aria-label="b" theme="outline" icon={<IconEdit />} />
                <IconButton aria-label="c" icon={<IconEdit />} />
                <Button>d</Button>
            </ButtonGroup>
        ));
        expect(lines()).toHaveLength(2);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
        expect(screen.getByRole('group').children[1]).toBe(lines()[0]);
    });

    it('button group 在 IconButton 之后的分隔线读全局 IconButton 键', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { theme: 'solid', type: 'danger' } };
        render(() => (
            <ButtonGroup>
                <IconButton aria-label="a" icon={<IconEdit />} />
                <Button>b</Button>
            </ButtonGroup>
        ));
        expect(lines()).toHaveLength(1);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('自定义 class 与 style 的 button group', () => {
        render(() => <ButtonGroup class="test" style={{ color: 'red' }} />);
        const group = screen.getByRole('group');
        expect(group).toHaveClass('test', `${prefixCls}-group`);
        expect(group).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('class 含 -with-icon 的普通 Button 仍有内容插槽标记', () => {
        render(() => <Button class="card-with-icon">x</Button>);
        expect(screen.getByText('x')).toHaveAttribute('x-semi-prop', 'children');
    });

    it('button group 的 ref 指向 role=group 根元素', () => {
        let group: HTMLDivElement | undefined;
        render(() => <ButtonGroup ref={(node) => (group = node)} />);
        expect(group).toBe(screen.getByRole('group'));
    });

    it('disabled 的 button 同时设置 disabled 与 aria-disabled，并切换类型 class', () => {
        render(() => (
            <Button type="danger" disabled theme="solid">
                x
            </Button>
        ));
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toHaveClass(`${prefixCls}-disabled`, `${prefixCls}-danger-disabled`, `${prefixCls}-solid`);
        expect(button).not.toHaveClass(`${prefixCls}-danger`);
    });

    it('disabled 的 button 内点击不调用 onClick，也不冒泡到祖先元素', () => {
        const outer = vi.fn<Handler>();
        const onClick = vi.fn<Handler>();
        const [disabled, setDisabled] = createSignal(true);
        render(() => (
            <div role="presentation" onClick={outer}>
                <Button disabled={disabled()} onClick={onClick}>
                    text
                </Button>
            </div>
        ));
        fireEvent.click(screen.getByText('text'));
        expect(onClick).not.toHaveBeenCalled();
        expect(outer).not.toHaveBeenCalled();
        setDisabled(false);
        fireEvent.click(screen.getByText('text'));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(outer).toHaveBeenCalledTimes(1);
    });

    it('icon 布局时文本 span 带 x-semi-prop，内容 span 不带；无 icon 时内容 span 带', () => {
        const view = render(() => <Button icon={<IconEdit />}>x</Button>);
        const content = view.container.querySelector(`.${prefixCls}-content`) as HTMLElement;
        expect(content).not.toHaveAttribute('x-semi-prop');
        expect(content.querySelector('[x-semi-prop="children"]')).toHaveTextContent('x');
        view.unmount();
        render(() => <Button>x</Button>);
        expect(document.querySelector(`.${prefixCls}-content`)).toHaveAttribute('x-semi-prop', 'children');
    });

    it('loading 时渲染 spinner，除非按钮为 disabled', () => {
        const [disabled, setDisabled] = createSignal(false);
        const { container } = render(() => (
            <Button loading disabled={disabled()}>
                x
            </Button>
        ));
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-loading`, `${prefixCls}-with-icon`);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);
        setDisabled(true);
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-with-icon`);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(0);
        expect(screen.getByText('x')).toHaveAttribute('x-semi-prop', 'children');
    });

    it('disabled 加 loading 时带 icon 的按钮没有 loading 类，仍显示 icon', () => {
        const { container } = render(() => (
            <Button disabled loading icon={<IconEdit />}>
                x
            </Button>
        ));
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-loading`);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(0);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
    });

    it('loading 时点击不触发 onClick 与原生监听，按钮标记 aria-disabled 且仍可聚焦', () => {
        const onClick = vi.fn<Handler>();
        const native = vi.fn<Handler>();
        const [loading, setLoading] = createSignal(true);
        render(() => (
            <Button loading={loading()} onClick={onClick} ref={(node) => node.addEventListener('click', native)}>
                x
            </Button>
        ));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
        expect(native).not.toHaveBeenCalled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toBeDisabled();
        button.focus();
        expect(button).toHaveFocus();
        setLoading(false);
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(native).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent));
    });

    it('loading 时 ref 里注册的 capture 监听也不调用，恢复后调用一次', () => {
        const capture = vi.fn<Handler>();
        const [loading, setLoading] = createSignal(true);
        render(() => (
            <Button loading={loading()} ref={(node) => node.addEventListener('click', capture, { capture: true })}>
                x
            </Button>
        ));
        fireEvent.click(screen.getByRole('button'));
        expect(capture).not.toHaveBeenCalled();
        setLoading(false);
        fireEvent.click(screen.getByRole('button'));
        expect(capture).toHaveBeenCalledTimes(1);
    });

    it('带 icon 的 loading 按钮同样不触发 onClick，恢复后触发一次', () => {
        const onClick = vi.fn<Handler>();
        const [loading, setLoading] = createSignal(true);
        const { container } = render(() => (
            <Button loading={loading()} icon={<IconEdit />} onClick={onClick}>
                x
            </Button>
        ));
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
        setLoading(false);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('loading 时键盘激活产生的 click 不冒泡到祖先', () => {
        const outer = vi.fn<Handler>();
        render(() => (
            <div role="presentation" onClick={outer}>
                <Button loading>x</Button>
            </div>
        ));
        fireEvent.click(screen.getByRole('button'));
        expect(outer).not.toHaveBeenCalled();
    });

    it('loading 时 submit 按钮不提交表单且保持焦点，恢复后提交', async () => {
        const submit = vi.fn<() => void>();
        const [loading, setLoading] = createSignal(true);
        render(() => (
            <form
                aria-label="form"
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <Button htmlType="submit" loading={loading()}>
                    save
                </Button>
            </form>
        ));
        const button = screen.getByRole('button');
        button.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.click(button);
        expect(submit).not.toHaveBeenCalled();
        expect(button).toHaveFocus();
        setLoading(false);
        await userEvent.click(button);
        expect(submit).toHaveBeenCalledTimes(1);
    });

    it('children 为 false 或空串时按钮是纯图标按钮，不渲染空的文字 span', () => {
        for (const children of [false, '']) {
            const { container, unmount } = render(() => <Button icon={<IconEdit />}>{children}</Button>);
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-with-icon-only`);
            expect(container.querySelector(`.${prefixCls}-content-right`)).toBeNull();
            unmount();
        }
    });

    it('colorful 图标组件按 theme、type、disabled 得到多色或双色填充', () => {
        const [looks, setLooks] = createSignal<{ type: Type; theme: Theme; disabled?: boolean }>({ type: 'tertiary', theme: 'solid' });
        render(() => <Button colorful type={looks().type} theme={looks().theme} disabled={looks().disabled} icon={FillProbe} />);
        expect(readFill()).toEqual(multiple);
        setLooks({ type: 'tertiary', theme: 'solid', disabled: true });
        expect(readFill()).toEqual(Array(4).fill('var(--semi-color-disabled-text)'));
        setLooks({ type: 'tertiary', theme: 'outline' });
        expect(readFill()).toEqual(['var(--semi-button-colorful-fill-primary, var(--semi-color-ai-purple))', 'var(--semi-button-colorful-fill-secondary, var(--semi-color-text-0))']);
        setLooks({ type: 'primary', theme: 'solid' });
        expect(readFill()).toBeNull();
    });

    it('colorful 的多色图标组件把填充写进 svg，非 colorful 时用图标自身的颜色', () => {
        const [colorful, setColorful] = createSignal(true);
        const { container } = render(() => <Button colorful={colorful()} icon={IconAIEditLevel2} aria-label="ai" />);
        const fills = () => [...container.querySelectorAll('svg [fill]')].map((node) => node.getAttribute('fill'));
        expect(fills().some((fill) => fill?.startsWith('var(--semi-button-colorful-multiple-fill-'))).toBe(true);
        setColorful(false);
        expect(fills().some((fill) => fill?.startsWith('var(--semi-button-colorful'))).toBe(false);
        expect(container.querySelectorAll('svg')).toHaveLength(1);
    });

    it('colorful 不传 theme、type 时仍得到多色填充与 AI loading 图标', () => {
        const [loading, setLoading] = createSignal(false);
        render(() => <Button colorful loading={loading()} icon={FillProbe} />);
        expect(readFill()).toEqual(multiple);
        setLoading(true);
        expect(document.querySelector(`.${prefixCls}-content-loading-icon`)).toBeInTheDocument();
        expect(document.querySelector('[data-icon="spin"]')).toBeNull();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid', type: 'danger' } };
        const view = render(() => <Button>x</Button>);
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-danger`);
        view.unmount();
        render(() => <Button type="primary">x</Button>);
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-primary`);
    });

    it('button group 的属性作为默认值，子按钮自身的值优先，分隔线读有效值', () => {
        render(() => (
            <ButtonGroup type="danger" colorful size="small" theme="solid">
                <Button type="primary" theme="light">
                    a
                </Button>
                <Button>b</Button>
                <Button theme="outline">c</Button>
            </ButtonGroup>
        ));
        const [a, b, c] = screen.getAllByRole('button');
        expect(a).toHaveClass(`${prefixCls}-primary`, `${prefixCls}-light`, `${prefixCls}-size-small`);
        expect(a).not.toHaveClass(`${prefixCls}-solid`);
        expect(b).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-solid`, `${prefixCls}-colorful`);
        expect(c).toHaveClass(`${prefixCls}-outline`);
        expect(c).not.toHaveClass(`${prefixCls}-solid`);
        expect(lines()).toHaveLength(2);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines()[1]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('button group 的分隔线跟随 group 的默认值与 disabled', () => {
        render(() => (
            <ButtonGroup type="danger" disabled theme="solid">
                <Button>a</Button>
                <Button>b</Button>
            </ButtonGroup>
        ));
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`, `${prefixCls}-group-line-disabled`);
    });

    it('button group 把其他属性与事件放在 group 根元素上，而非按钮上', () => {
        const onClick = vi.fn<Handler>();
        render(() => (
            <ButtonGroup id="g" data-foo="bar" aria-describedby="d" aria-label="actions" onClick={onClick}>
                <Button>a</Button>
            </ButtonGroup>
        ));
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

    it('使用方传入的 role 覆盖 button group 的默认 role', () => {
        render(() => <ButtonGroup role="toolbar" />);
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('outline 按钮后不绘制分隔线', () => {
        render(() => (
            <ButtonGroup>
                <Button theme="outline">a</Button>
                <Button>b</Button>
                <Button disabled>c</Button>
            </ButtonGroup>
        ));
        expect(lines()).toHaveLength(1);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines()[0]).not.toHaveClass(`${prefixCls}-group-line-disabled`);
    });

    it('无论是否带 icon，ref 都指向原生 button，contentClassName 落在内容 span', () => {
        const [icon, setIcon] = createSignal(false);
        let ref: HTMLButtonElement | undefined;
        render(() => (
            <Button ref={(node) => (ref = node)} contentClassName="inner" icon={icon() ? <IconEdit /> : undefined}>
                x
            </Button>
        ));
        const button = screen.getByRole('button');
        expect(ref).toBe(button);
        setIcon(true);
        expect(screen.getByRole('button')).toBe(button);
        expect(button).not.toHaveAttribute('contentclassname');
        expect(document.querySelector(`.${prefixCls}-content`)).toHaveClass('inner');
    });

    it('Props 类型不声明 iconSize、iconStyle、circle、prefixCls', () => {
        expectTypeOf<ButtonProps>().not.toHaveProperty('iconSize');
        expectTypeOf<ButtonProps>().not.toHaveProperty('iconStyle');
        expectTypeOf<ButtonProps>().not.toHaveProperty('circle');
        expectTypeOf<ButtonProps>().not.toHaveProperty('prefixCls');
        expectTypeOf<ButtonProps['disabled']>().toEqualTypeOf<boolean | undefined>();
    });

    it('自身值为 undefined 才吃组值，自身 false 胜过组 true', () => {
        render(() => (
            <ButtonGroup disabled type="danger">
                <Button disabled={false}>own</Button>
                <Button disabled={undefined} type={undefined}>
                    undefined
                </Button>
            </ButtonGroup>
        ));
        const [own, empty] = screen.getAllByRole('button');
        expect(own).toBeEnabled();
        expect(empty).toBeDisabled();
        expect(empty).toHaveClass(`${prefixCls}-danger-disabled`);
    });

    it('全局默认值优先级：自身 > 组 > Button 键 > 组件默认值', () => {
        semiGlobal.config.overrideDefaultProps = {
            Button: { size: 'large', theme: 'solid', type: 'warning', block: true, htmlType: 'submit', loading: true },
        };
        const view = render(() => <Button>x</Button>);
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-large`, `${prefixCls}-solid`, `${prefixCls}-warning`, `${prefixCls}-block`, `${prefixCls}-loading`);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
        view.unmount();
        render(() => (
            <ButtonGroup size="small" type="danger">
                <Button theme="borderless">a</Button>
            </ButtonGroup>
        ));
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-small`, `${prefixCls}-danger`, `${prefixCls}-borderless`);
    });

    it('全局 Button 键的 disabled 与 colorful 生效，自身 disabled=false 胜过全局 true', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { disabled: true, colorful: true, loading: true } };
        const view = render(() => <Button>x</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-colorful`);
        view.unmount();
        render(() => <Button disabled={false}>x</Button>);
        expect(screen.getByRole('button')).toBeEnabled();
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-colorful`, `${prefixCls}-loading`);
    });

    it('iconPosition 读 Button 全局键', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { iconPosition: 'right' } };
        render(() => <Button icon={<IconEdit />}>x</Button>);
        expect(document.querySelectorAll(`.${prefixCls}-content-left`)).toHaveLength(1);
    });

    it('ButtonGroup 全局键作为组默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ButtonGroup: { size: 'small' } };
        render(() => (
            <ButtonGroup>
                <Button>a</Button>
            </ButtonGroup>
        ));
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-small`);
    });

    it('组值优先于全局 overrideDefaultProps，分隔线与按钮一致', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { size: 'large', theme: 'borderless' }, IconButton: { size: 'large', theme: 'borderless' } };
        render(() => (
            <ButtonGroup size="small" theme="solid">
                <Button>a</Button>
                <IconButton aria-label="b" icon={<IconEdit />} />
            </ButtonGroup>
        ));
        screen.getAllByRole('button').forEach((button) => expect(button).toHaveClass(`${prefixCls}-size-small`, `${prefixCls}-solid`));
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`);
    });

    it('IconButton 键只作用于 IconButton，带 icon 的 Button 不读它', () => {
        semiGlobal.config.overrideDefaultProps = {
            IconButton: { type: 'danger', block: true, loading: true, iconPosition: 'right', htmlType: 'submit', noHorizontalPadding: true },
        };
        render(() => (
            <>
                <Button icon={<IconEdit />}>x</Button>
                <IconButton aria-label="edit" icon={<IconEdit />}>
                    x
                </IconButton>
            </>
        ));
        const [button, iconButton] = screen.getAllByRole('button');
        expect(button).toHaveClass(`${prefixCls}-primary`);
        expect(button).not.toHaveClass(`${prefixCls}-block`);
        expect(button).not.toHaveClass(`${prefixCls}-loading`);
        expect(button).toHaveAttribute('type', 'button');
        expect(button.querySelector(`.${prefixCls}-content-right`)).not.toBeNull();
        expect(button.style.paddingLeft).toBe('');
        expect(iconButton).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-block`, `${prefixCls}-loading`);
        expect(iconButton).toHaveAttribute('type', 'submit');
        expect(iconButton.querySelector(`.${prefixCls}-content-left`)).not.toBeNull();
        expect(iconButton).toHaveStyle({ paddingLeft: '0px' });
    });

    it('弹层层级内的 Button 不继承组值，其后也没有分隔线', () => {
        render(() => (
            <ButtonGroup disabled type="danger">
                <PopupLayerContext.Provider value={Symbol('popup')}>
                    <Button>in popup</Button>
                </PopupLayerContext.Provider>
                <Button>b</Button>
            </ButtonGroup>
        ));
        const popupButton = screen.getByRole('button', { name: 'in popup' });
        expect(popupButton).toBeEnabled();
        expect(popupButton).toHaveClass(`${prefixCls}-primary`);
        expect(screen.getByRole('button', { name: 'b' })).toBeDisabled();
        expect(lines()).toHaveLength(0);
    });

    it('嵌套 ButtonGroup 继承外层，内层自身值优先', () => {
        render(() => (
            <ButtonGroup size="small" type="danger">
                <ButtonGroup type="warning">
                    <Button>a</Button>
                </ButtonGroup>
            </ButtonGroup>
        ));
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-small`, `${prefixCls}-warning`);
    });

    it('包在其他元素里的按钮继承组值，但不画分隔线', () => {
        render(() => (
            <ButtonGroup disabled>
                <span data-testid="plain">
                    <Button>a</Button>
                </span>
                <Button>b</Button>
            </ButtonGroup>
        ));
        screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
        expect(screen.getByTestId('plain')).not.toHaveAttribute('disabled');
        expect(lines()).toHaveLength(0);
    });

    it('全局 Button 键设 solid、danger 时分隔线跟随', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid', type: 'danger' } };
        render(() => (
            <ButtonGroup>
                <Button>a</Button>
                <Button>b</Button>
            </ButtonGroup>
        ));
        expect(screen.getByRole('button', { name: 'a' })).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-danger`);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('分隔线数量覆盖空组、单个按钮与 For 重排，重排保留原 DOM', () => {
        render(() => <ButtonGroup />);
        expect(lines()).toHaveLength(0);
        const [order, setOrder] = createSignal(['a']);
        render(() => (
            <ButtonGroup>
                <For each={order()}>{(name) => <Button>{name}</Button>}</For>
            </ButtonGroup>
        ));
        expect(lines()).toHaveLength(0);
        setOrder(['a', 'b', 'c']);
        const a = screen.getByRole('button', { name: 'a' });
        const c = screen.getByRole('button', { name: 'c' });
        expect(lines()).toHaveLength(2);
        setOrder(['c', 'a', 'b']);
        expect(screen.getByRole('button', { name: 'a' })).toBe(a);
        expect(screen.getByRole('button', { name: 'c' })).toBe(c);
        expect(screen.getAllByRole('button').map((el) => el.textContent)).toEqual(['c', 'a', 'b']);
        expect(lines()).toHaveLength(2);
    });

    it('分隔线随按钮与组的有效值变化，按钮变为 outline 时消失', () => {
        const [theme, setTheme] = createSignal<Theme | undefined>(undefined);
        const [type, setType] = createSignal<Type>('danger');
        render(() => (
            <ButtonGroup type={type()}>
                <Button theme={theme()}>a</Button>
                <Button>b</Button>
            </ButtonGroup>
        ));
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-danger`);
        setType('warning');
        expect(screen.getByRole('button', { name: 'a' })).toHaveClass(`${prefixCls}-warning`);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-warning`);
        setTheme('solid');
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`);
        setTheme('outline');
        expect(lines()).toHaveLength(0);
        setTheme(undefined);
        expect(lines()).toHaveLength(1);
    });

    it('原生属性与事件落在原生 button，使用方 aria-disabled 不能覆盖计算值', () => {
        const enter = vi.fn<Handler>();
        const down = vi.fn<Handler>();
        render(() => <Button id="b" title="t" aria-label="label" data-foo="1" aria-disabled={false} onMouseEnter={enter} onMouseDown={down} loading />);
        const button = screen.getByRole('button', { name: 'label' });
        expect(button).toHaveAttribute('id', 'b');
        expect(button).toHaveAttribute('title', 't');
        expect(button).toHaveAttribute('data-foo', '1');
        expect(button).toHaveAttribute('aria-disabled', 'true');
        fireEvent.mouseEnter(button);
        fireEvent.mouseDown(button);
        expect(enter).toHaveBeenCalledTimes(1);
        expect(down).toHaveBeenCalledTimes(1);
    });

    it('onClick 为绑定数据的数组形式时同样调用', () => {
        const onClick = vi.fn<(data: string, event: MouseEvent) => void>();
        render(() => <Button onClick={[onClick, 'data']}>x</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledWith('data', expect.any(MouseEvent));
    });

    it('loading 与 icon 切换时保留同一个原生 button 与焦点', () => {
        const [next, setNext] = createSignal<ButtonProps>({});
        render(() => (
            <Button loading={next().loading} icon={next().icon}>
                save
            </Button>
        ));
        const button = screen.getByRole('button');
        button.focus();
        for (const props of [{ loading: true }, { icon: <IconEdit /> }, {}] satisfies ButtonProps[]) {
            setNext(props);
            expect(screen.getByRole('button')).toBe(button);
            expect(button).toHaveFocus();
            expect(button).toHaveTextContent('save');
        }
    });

    it('noHorizontalPadding 无 icon 时不产生 DOM 属性或内联 padding；有 icon 时组件值优先于 style', () => {
        const view = render(() => <Button noHorizontalPadding="left">x</Button>);
        const button = screen.getByRole('button');
        expect(button).not.toHaveAttribute('nohorizontalpadding');
        expect(button.style.paddingLeft).toBe('');
        view.unmount();
        // the string form is still part of the style type, so it is merged too
        const inline: string = 'padding-left: 8px; padding-right: 8px';
        render(() => (
            <>
                <Button aria-label="object" style={{ 'padding-left': '8px', 'padding-right': '8px' }} noHorizontalPadding="left" icon={<IconEdit />} />
                <Button aria-label="string" style={inline} noHorizontalPadding="left" icon={<IconEdit />} />
            </>
        ));
        for (const name of ['object', 'string']) {
            expect(screen.getByRole('button', { name })).toHaveStyle({ paddingLeft: '0px', paddingRight: '8px' });
        }
    });
});
