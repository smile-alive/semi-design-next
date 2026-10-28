/** @jsxImportSource vue */
import { createTextVNode, ref, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen } from '@testing-library/vue';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconEdit } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import elementType from '../../_base/element-type';
import semiGlobal from '../../_utils/semi-global';
import IconButton from '../../icon-button';
import Tooltip from '../../tooltip';
import ButtonGroup from '../button-group.vue';
import Button, { type ButtonGroupProps, type ButtonProps, type HtmlType } from '../index';
import AttrsTypes from './fixtures/attrs-types.vue';
import FillProbe from './fixtures/fill-probe.vue';
import FormSubmit from './fixtures/form-submit.vue';
import GroupLoop from './fixtures/group-loop.vue';
import GroupReorder from './fixtures/group-reorder.vue';
import GroupWrapped from './fixtures/group-wrapped.vue';
import IconToggle from './fixtures/icon-toggle.vue';
import PaddingShorthand from './fixtures/padding-shorthand.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-button`;
type Handler = (event: MouseEvent) => void;
const readFill = (): unknown => JSON.parse(screen.getByTestId('icon').dataset.fill ?? 'null');
const iconSlot = { icon: () => <IconEdit /> };
const probeSlot = { icon: () => <FillProbe /> };
const text = { default: () => 'x' };
const group = (props: Record<string, unknown>, ...children: VNode[]) => render(() => <ButtonGroup {...props}>{() => children}</ButtonGroup>);
const elapse = () => new Promise((resolve) => setTimeout(resolve, 5));
const lines = () => document.querySelectorAll(`.${prefixCls}-group-line`);
const multiple = [3, 2, 1, 0].map((level, i) => `var(--semi-button-colorful-multiple-fill-${i}, var(--semi-ai-general-5-${level}))`);

describe('Button', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('自定义 class 与 style 的 button', () => {
        render(Button, { attrs: { class: 'test', style: 'color: red' } });
        const button = screen.getByRole('button');
        expect(button).toHaveClass('test');
        expect(button).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 icon 的 button', () => {
        const { container } = render(Button, { slots: iconSlot });
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
    });

    it('水平内边距，布尔简写与数组都生效', () => {
        const view = render(PaddingShorthand);
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '0px' });
        view.unmount();
        render(Button, { props: { noHorizontalPadding: ['left', 'right'] }, slots: iconSlot });
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '0px' });
    });

    it('loading 状态', () => {
        const { container } = render(Button, { props: { loading: true }, slots: iconSlot });
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(0);
    });

    it('button 类型', () => {
        const types: HtmlType[] = ['button', 'reset', 'submit'];
        for (const htmlType of types) {
            const view = render(Button, { props: { htmlType } });
            expect(screen.getByRole('button')).toHaveAttribute('type', htmlType);
            view.unmount();
        }
    });

    it('位置', () => {
        const { container } = render(Button, {
            props: { iconPosition: 'right' },
            slots: { ...iconSlot, ...text },
        });
        expect(container.querySelectorAll(`.${prefixCls}-content-left`)).toHaveLength(1);
        expect(container.querySelectorAll(`.${prefixCls}-content-right`)).toHaveLength(0);
        const content = container.querySelector(`.${prefixCls}-content`) as HTMLElement;
        expect(content.firstElementChild).toHaveTextContent('x');
    });

    it('包含无效子节点的 button group', () => {
        const { container } = render(GroupLoop, { props: { showLast: false } });
        expect(container).toHaveTextContent('1 查询剪切');
        expect(screen.getAllByRole('button')).toHaveLength(2);
        expect(lines()).toHaveLength(1);
    });

    it('button group 末项被 v-if 隐藏时分隔线数量等于可见按钮数减一', async () => {
        const view = render(GroupLoop, { props: { showLast: false } });
        expect(lines()).toHaveLength(1);
        expect(screen.getByRole('group').lastElementChild).toBe(screen.getByText('剪切').closest('button'));
        await view.rerender({ showLast: true });
        expect(lines()).toHaveLength(2);
    });

    it('button group 中 v-for 生成的按钮继承组的 disabled，且之间有分隔线', () => {
        render(GroupLoop, { props: { disabled: true, items: ['a', 'b'], showLast: false } });
        screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
        expect(screen.getAllByRole('button')).toHaveLength(4);
        expect(lines()).toHaveLength(3);
    });

    it('button group 在 IconButton 之后也画分隔线，outline 与末项除外', () => {
        group(
            { type: 'danger', theme: 'solid' },
            <IconButton aria-label="a">{iconSlot}</IconButton>,
            <IconButton aria-label="b" theme="outline">
                {iconSlot}
            </IconButton>,
            <IconButton aria-label="c">{iconSlot}</IconButton>,
            <Button>{text}</Button>
        );
        expect(lines()).toHaveLength(2);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
        expect(screen.getByRole('group').children[1]).toBe(lines()[0]);
    });

    it('button group 在 IconButton 之后的分隔线读全局 IconButton 键', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { theme: 'solid', type: 'danger' } };
        group({}, <IconButton aria-label="a">{iconSlot}</IconButton>, <Button>{text}</Button>);
        expect(lines()).toHaveLength(1);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('自定义 class 与 style 的 button group', () => {
        render(ButtonGroup, { attrs: { class: 'test', style: 'color: red' } });
        const el = screen.getByRole('group');
        expect(el).toHaveClass('test', `${prefixCls}-group`);
        expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('class 含 -with-icon 的普通 Button 仍有内容插槽标记', () => {
        render(Button, { attrs: { class: 'card-with-icon' }, slots: text });
        expect(screen.getByText('x')).toHaveAttribute('x-semi-prop', 'children');
    });

    it('button group 的模板 ref 指向 role=group 根元素', () => {
        const groupRef = ref<InstanceType<typeof ButtonGroup> | null>(null);
        render(() => <ButtonGroup ref={groupRef} />);
        expect(groupRef.value?.$el).toBe(screen.getByRole('group'));
    });

    it('disabled 的 button 同时设置 disabled 与 aria-disabled，并切换类型 class', () => {
        render(Button, { props: { type: 'danger', disabled: true, theme: 'solid' }, slots: text });
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toHaveClass(`${prefixCls}-disabled`, `${prefixCls}-danger-disabled`, `${prefixCls}-solid`);
        expect(button).not.toHaveClass(`${prefixCls}-danger`);
    });

    it('icon 布局时文本 span 带 x-semi-prop，内容 span 不带；无 icon 时内容 span 带', () => {
        const view = render(Button, { slots: { ...iconSlot, ...text } });
        const content = view.container.querySelector(`.${prefixCls}-content`) as HTMLElement;
        expect(content).not.toHaveAttribute('x-semi-prop');
        expect(content.querySelector('[x-semi-prop="children"]')).toHaveTextContent('x');
        view.unmount();
        render(Button, { slots: text });
        expect(document.querySelector(`.${prefixCls}-content`)).toHaveAttribute('x-semi-prop', 'children');
    });

    it('loading 时渲染 spinner，除非按钮为 disabled', async () => {
        const view = render(Button, { props: { loading: true }, slots: text });
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-loading`, `${prefixCls}-with-icon`);
        expect(view.container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);
        await view.rerender({ disabled: true });
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-with-icon`);
        expect(view.container.querySelectorAll('[data-icon="spin"]')).toHaveLength(0);
    });

    it('disabled 加 loading 时带 icon 的按钮没有 loading 类', () => {
        const { container } = render(Button, {
            props: { disabled: true, loading: true },
            slots: { ...iconSlot, ...text },
        });
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-loading`);
        expect(container.querySelectorAll('[data-icon="spin"]')).toHaveLength(0);
        expect(container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
    });

    it('loading 时点击不触发 click，按钮标记 aria-disabled 且仍可聚焦', async () => {
        const onClick = vi.fn<Handler>();
        const view = render(Button, { attrs: { onClick }, props: { loading: true }, slots: text });
        const button = screen.getByRole('button');
        await fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toBeDisabled();
        button.focus();
        expect(button).toHaveFocus();
        await view.rerender({ loading: false });
        await fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('带 icon 的 loading 按钮同样不触发 click，恢复后触发一次', async () => {
        const onClick = vi.fn<Handler>();
        const view = render(Button, { attrs: { onClick }, props: { loading: true }, slots: { ...iconSlot, ...text } });
        await fireEvent.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
        await view.rerender({ loading: false });
        await fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('colorful 图标使用多色或双色填充', async () => {
        const view = render(Button, { props: { type: 'tertiary', colorful: true, theme: 'solid' }, slots: probeSlot });
        expect(readFill()).toEqual(multiple);
        await view.rerender({ disabled: true });
        expect(readFill()).toEqual(Array(4).fill('var(--semi-color-disabled-text)'));
        await view.rerender({ disabled: false, theme: 'outline' });
        expect(readFill()).toEqual(['var(--semi-button-colorful-fill-primary, var(--semi-color-ai-purple))', 'var(--semi-button-colorful-fill-secondary, var(--semi-color-text-0))']);
        await view.rerender({ type: 'primary', theme: 'solid' });
        expect(readFill()).toBeNull();
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid', type: 'danger' } };
        const view = render(Button, { slots: text });
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-danger`);
        view.unmount();
        render(Button, { props: { type: 'primary' }, slots: text });
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-primary`);
    });

    it('button group 的属性作为默认值，子按钮自身的值优先', () => {
        group(
            { type: 'danger', colorful: true, size: 'small', theme: 'solid' },
            <Button type="primary" theme="light">
                {() => 'a'}
            </Button>,
            <Button>{() => 'b'}</Button>,
            <Button theme="outline">{() => 'c'}</Button>
        );
        const [a, b, c] = screen.getAllByRole('button');
        expect(a).toHaveClass(`${prefixCls}-primary`, `${prefixCls}-light`, `${prefixCls}-size-small`);
        expect(a).not.toHaveClass(`${prefixCls}-solid`);
        expect(b).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-solid`, `${prefixCls}-colorful`);
        expect(c).toHaveClass(`${prefixCls}-outline`);
        expect(c).not.toHaveClass(`${prefixCls}-solid`);
        // separators read the effective props: a is light/primary, so its line follows a, not the group
        expect(lines()).toHaveLength(2);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines()[1]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('button group 的分隔符跟随 group 的默认值与 disabled', () => {
        group({ type: 'danger', disabled: true, theme: 'solid' }, <Button>{() => 'a'}</Button>, <Button>{() => 'b'}</Button>);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`, `${prefixCls}-group-line-disabled`);
    });

    it('button group 把其他属性与事件放在 group 根元素上，而非按钮上', async () => {
        const onClick = vi.fn<Handler>();
        group({ id: 'g', 'data-foo': 'bar', 'aria-describedby': 'd', 'aria-label': 'actions', onClick }, <Button>{() => 'a'}</Button>);
        const el = screen.getByRole('group', { name: 'actions' });
        expect(el).toHaveAttribute('data-foo', 'bar');
        expect(el).toHaveAttribute('id', 'g');
        expect(el).toHaveAttribute('aria-describedby', 'd');
        const button = screen.getByRole('button');
        expect(button).not.toHaveAttribute('data-foo');
        expect(button).not.toHaveAttribute('aria-describedby');
        await elapse();
        await userEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('使用方传入的 role 覆盖 button group 的默认 role', () => {
        render(ButtonGroup, { attrs: { role: 'toolbar' } });
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('outline 按钮后不绘制分隔符', () => {
        group({}, <Button theme="outline">{() => 'a'}</Button>, <Button>{() => 'b'}</Button>, <Button disabled>{() => 'c'}</Button>);
        expect(lines()).toHaveLength(1);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines()[0]).not.toHaveClass(`${prefixCls}-group-line-disabled`);
    });

    it('无论是否带 icon，模板 ref 的 $el 都是原生 button，contentClassName 落在内容 span', async () => {
        const view = render(Button, { slots: text });
        expect(view.container.firstElementChild).toBe(screen.getByRole('button'));
        await view.rerender({ contentClassName: 'inner' });
        expect(screen.getByRole('button')).not.toHaveAttribute('contentclassname');
        expect(document.querySelector(`.${prefixCls}-content`)).toHaveClass('inner');
    });

    it('Props 类型不声明 iconSize、iconStyle、circle、prefixCls、icon、children', () => {
        expectTypeOf<ButtonProps>().not.toHaveProperty('iconSize');
        expectTypeOf<ButtonProps>().not.toHaveProperty('iconStyle');
        expectTypeOf<ButtonProps>().not.toHaveProperty('circle');
        expectTypeOf<ButtonProps>().not.toHaveProperty('prefixCls');
        expectTypeOf<ButtonProps>().not.toHaveProperty('icon');
        expectTypeOf<ButtonProps>().not.toHaveProperty('children');
        expectTypeOf<ButtonProps['disabled']>().toEqualTypeOf<boolean | undefined>();
        expectTypeOf<ButtonGroupProps>().not.toHaveProperty('circle');
    });

    describe('Vue 特有', () => {
        it('自身值为 undefined 才吃组值，自身 false 胜过组 true', () => {
            group(
                { disabled: true, type: 'danger' },
                <Button disabled={false}>{() => 'own'}</Button>,
                <Button disabled={undefined} type={undefined}>
                    {() => 'undefined'}
                </Button>
            );
            const [own, empty] = screen.getAllByRole('button');
            expect(own).toBeEnabled();
            expect(empty).toBeDisabled();
            expect(empty).toHaveClass(`${prefixCls}-danger-disabled`);
        });

        it('显式 type=undefined 视同未传', () => {
            group({ type: 'danger' }, <Button type={undefined}>{() => 'a'}</Button>);
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-danger`);
        });

        it('disabled 简写与 true 都算真，分隔线随之 disabled', () => {
            group({}, <Button disabled={'' as unknown as boolean}>{() => 'a'}</Button>, <Button>{() => 'b'}</Button>);
            expect(screen.getAllByRole('button')[0]).toBeDisabled();
            expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-disabled`);
        });

        it('全局默认值优先级：自身 > 组 > Button 键 > 组件默认值', () => {
            semiGlobal.config.overrideDefaultProps = {
                Button: {
                    size: 'large',
                    theme: 'solid',
                    type: 'warning',
                    block: true,
                    htmlType: 'submit',
                    loading: true,
                },
            };
            const view = render(Button, { slots: text });
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-large`, `${prefixCls}-solid`, `${prefixCls}-warning`, `${prefixCls}-block`, `${prefixCls}-loading`);
            expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
            view.unmount();
            group({ size: 'small', type: 'danger' }, <Button theme="borderless">{() => 'a'}</Button>);
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-small`, `${prefixCls}-danger`, `${prefixCls}-borderless`);
        });

        it('全局 Button 键的 disabled 与 colorful 生效，自身 disabled=false 胜过全局 true', () => {
            semiGlobal.config.overrideDefaultProps = { Button: { disabled: true, colorful: true, loading: true } };
            const view = render(Button, { slots: text });
            expect(screen.getByRole('button')).toBeDisabled();
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-colorful`);
            view.unmount();
            render(Button, { props: { disabled: false }, slots: text });
            expect(screen.getByRole('button')).toBeEnabled();
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-colorful`, `${prefixCls}-loading`);
        });

        it('iconPosition 读 Button 全局键', () => {
            semiGlobal.config.overrideDefaultProps = { Button: { iconPosition: 'right' } };
            render(Button, { slots: { ...iconSlot, ...text } });
            expect(document.querySelectorAll(`.${prefixCls}-content-left`)).toHaveLength(1);
        });

        it('ButtonGroup 全局键作为组默认值', () => {
            semiGlobal.config.overrideDefaultProps = { ButtonGroup: { size: 'small' } };
            group({}, <Button>{() => 'a'}</Button>);
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-small`);
        });

        it('IconButton 键只作用于 IconButton，带 #icon 的 Button 不读它', () => {
            semiGlobal.config.overrideDefaultProps = { IconButton: { type: 'danger', block: true } };
            render(() => (
                <>
                    <Button>{iconSlot}</Button>
                    <IconButton aria-label="edit">{iconSlot}</IconButton>
                </>
            ));
            const [button, iconButton] = screen.getAllByRole('button');
            expect(button).toHaveClass(`${prefixCls}-primary`);
            expect(button).not.toHaveClass(`${prefixCls}-block`);
            expect(iconButton).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-block`);
        });

        it('IconButton 键的 loading、iconPosition、htmlType、noHorizontalPadding 同样只作用于 IconButton', () => {
            semiGlobal.config.overrideDefaultProps = {
                IconButton: { loading: true, iconPosition: 'right', htmlType: 'submit', noHorizontalPadding: true },
            };
            const withText = { ...iconSlot, ...text };
            render(() => (
                <>
                    <Button>{withText}</Button>
                    <IconButton aria-label="edit">{withText}</IconButton>
                </>
            ));
            const [button, iconButton] = screen.getAllByRole('button');
            expect(button).not.toHaveClass(`${prefixCls}-loading`);
            expect(button).toHaveAttribute('type', 'button');
            expect(button.querySelector(`.${prefixCls}-content-right`)).not.toBeNull();
            expect(button.querySelector(`.${prefixCls}-content-left`)).toBeNull();
            expect(button.style.paddingLeft).toBe('');
            expect(iconButton).toHaveClass(`${prefixCls}-loading`);
            expect(iconButton).toHaveAttribute('type', 'submit');
            expect(iconButton.querySelector(`.${prefixCls}-content-left`)).not.toBeNull();
            expect(iconButton.style.paddingLeft).toBe('0px');
        });

        it('IconButton 在组内继承组值，且其后有分隔线', () => {
            group({ type: 'danger' }, <IconButton aria-label="a">{iconSlot}</IconButton>, <Button>{() => 'b'}</Button>);
            expect(screen.getAllByRole('button')[0]).toHaveClass(`${prefixCls}-danger`);
            expect(lines()).toHaveLength(1);
        });

        it('Tooltip 包裹与自定义包装里的 Button 继承组值，非 Button 子节点不被注入属性', () => {
            render(GroupWrapped);
            const plain = screen.getByTestId('plain');
            expect(plain).not.toHaveAttribute('type');
            expect(plain).not.toHaveAttribute('disabled');
            const [tip, custom, nested, own] = screen.getAllByRole('button');
            expect(tip).toBeDisabled();
            expect(custom).toBeDisabled();
            expect(tip).toHaveClass(`${prefixCls}-danger-disabled`);
            // the inner group's type wins for its buttons; the outer disabled still reaches them
            expect(nested).toHaveClass(`${prefixCls}-warning-disabled`);
            expect(own).toHaveClass(`${prefixCls}-secondary-disabled`);
        });

        it('弹层里的 Button 不继承打开它的 ButtonGroup 的值', async () => {
            render(() => (
                <ButtonGroup disabled type="danger">
                    {() => (
                        <Tooltip motion={false} trigger="custom" visible>
                            {{
                                default: () => <span>anchor</span>,
                                content: () => <Button>{() => 'in popup'}</Button>,
                            }}
                        </Tooltip>
                    )}
                </ButtonGroup>
            ));
            const popupButton = await screen.findByRole('button', { name: 'in popup' });
            expect(popupButton).toBeEnabled();
            expect(popupButton).toHaveClass(`${prefixCls}-primary`);
        });

        it('嵌套 ButtonGroup 继承外层，内层自身值优先', () => {
            render(() => (
                <ButtonGroup size="small" type="danger">
                    {() => <ButtonGroup type="warning">{() => <Button>{() => 'a'}</Button>}</ButtonGroup>}
                </ButtonGroup>
            ));
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-small`, `${prefixCls}-warning`);
        });

        it('全局 Button 键设 solid、danger 时分隔线跟随', () => {
            semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid', type: 'danger' } };
            group({}, <Button>{() => 'a'}</Button>, <Button>{() => 'b'}</Button>);
            expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
        });

        it('分隔线数量覆盖单个按钮、空组、v-for 重排且按 key 保持 DOM', async () => {
            group({});
            expect(lines()).toHaveLength(0);
            const view = render(GroupReorder, { props: { order: ['a'] } });
            expect(document.querySelectorAll(`.${prefixCls}-group-line`)).toHaveLength(0);
            await view.rerender({ order: ['a', 'b', 'c'] });
            const a = screen.getByRole('button', { name: 'a' });
            const c = screen.getByRole('button', { name: 'c' });
            expect(lines()).toHaveLength(2);
            await view.rerender({ order: ['c', 'a', 'b'] });
            expect(screen.getByRole('button', { name: 'a' })).toBe(a);
            expect(screen.getByRole('button', { name: 'c' })).toBe(c);
            expect(screen.getAllByRole('button').map((el) => el.textContent)).toEqual(['c', 'a', 'b']);
            expect(lines()).toHaveLength(2);
        });

        it('elementType 区分 Button 与 IconButton', () => {
            expect(elementType(<Button />)).toBe('Button');
            expect(elementType(<IconButton />)).toBe('IconButton');
        });

        it('原生属性与事件落在原生 button，使用方 aria-disabled 不能覆盖计算值', async () => {
            const enter = vi.fn<Handler>();
            const down = vi.fn<Handler>();
            render(Button, {
                attrs: {
                    id: 'b',
                    title: 't',
                    'aria-label': 'label',
                    'data-foo': '1',
                    'aria-disabled': 'false',
                    onMouseenter: enter,
                    onMousedown: down,
                },
                props: { loading: true },
            });
            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('id', 'b');
            expect(button).toHaveAttribute('title', 't');
            expect(button).toHaveAttribute('data-foo', '1');
            expect(button).toHaveAttribute('aria-disabled', 'true');
            await userEvent.hover(button);
            await fireEvent.mouseDown(button);
            expect(enter).toHaveBeenCalledTimes(1);
            expect(down).toHaveBeenCalledTimes(1);
        });

        it('click 载荷是原生 MouseEvent，onClick 为数组时都被调用', async () => {
            const first = vi.fn<Handler>();
            const second = vi.fn<Handler>();
            render(Button, { attrs: { onClick: [first, second] } });
            await fireEvent.click(screen.getByRole('button'));
            expect(first).toHaveBeenCalledWith(expect.any(MouseEvent));
            expect(second).toHaveBeenCalledTimes(1);
        });

        it('loading 时 submit 按钮不提交表单，恢复后提交', async () => {
            const view = render(FormSubmit, { props: { loading: true } });
            const button = screen.getByRole('button');
            button.focus();
            await userEvent.keyboard('{Enter}');
            await userEvent.click(button);
            expect(view.emitted().submit).toBeUndefined();
            expect(button).toHaveFocus();
            await view.rerender({ loading: false });
            await userEvent.click(screen.getByRole('button'));
            expect(view.emitted().submit).toHaveLength(1);
        });

        it('空 #icon 不进入 icon 布局，空文本视同无 children', () => {
            const view = render(Button, { slots: { icon: () => [], default: () => 'x' } });
            expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-with-icon`);
            view.unmount();
            render(Button, { slots: { ...iconSlot, default: () => [createTextVNode('')] } });
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-with-icon-only`);
        });

        it('loading 与 #icon 切换时原生 button 是同一个元素', async () => {
            const view = render(Button, { slots: text });
            const button = screen.getByRole('button');
            await view.rerender({ loading: true });
            expect(screen.getByRole('button')).toBe(button);
            await view.rerender({ loading: false });
            expect(screen.getByRole('button')).toBe(button);
        });

        it('#icon 切换时原生 button 是同一个元素', async () => {
            const view = render(IconToggle);
            const button = screen.getByRole('button');
            expect(button).not.toHaveClass(`${prefixCls}-with-icon`);
            await view.rerender({ showIcon: true });
            expect(screen.getByRole('button')).toBe(button);
            expect(button).toHaveClass(`${prefixCls}-with-icon`);
            await view.rerender({ showIcon: false });
            expect(screen.getByRole('button')).toBe(button);
            expect(button).not.toHaveClass(`${prefixCls}-with-icon`);
        });

        it('loading 时 onClickOnce 与 onClickCapture 都不调用，恢复后 onClickOnce 调用一次', async () => {
            const once = vi.fn<Handler>();
            const capture = vi.fn<Handler>();
            const view = render(Button, {
                attrs: { onClickOnce: once, onClickCapture: capture },
                props: { loading: true },
            });
            await fireEvent.click(screen.getByRole('button'));
            expect(once).not.toHaveBeenCalled();
            expect(capture).not.toHaveBeenCalled();
            await view.rerender({ loading: false });
            await fireEvent.click(screen.getByRole('button'));
            expect(once).toHaveBeenCalledTimes(1);
            expect(capture).toHaveBeenCalledTimes(1);
        });

        it('colorful 不传 theme、type 时仍得到多色填充与 AI loading 图标', async () => {
            const view = render(Button, { props: { colorful: true }, slots: probeSlot });
            expect(readFill()).toEqual(multiple);
            await view.rerender({ loading: true });
            expect(document.querySelector(`.${prefixCls}-content-loading-icon`)).toBeInTheDocument();
        });

        it('noHorizontalPadding 无 icon 时不产生 DOM 属性或内联 padding；有 icon 时组件值优先于 style', () => {
            const view = render(Button, { props: { noHorizontalPadding: 'left' }, slots: text });
            const button = screen.getByRole('button');
            expect(button).not.toHaveAttribute('nohorizontalpadding');
            expect(button.style.paddingLeft).toBe('');
            view.unmount();
            render(Button, {
                attrs: { style: 'padding-left: 8px; padding-right: 8px' },
                props: { noHorizontalPadding: 'left' },
                slots: iconSlot,
            });
            expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '8px' });
        });

        it('原生属性在类型上可用，ButtonProps 为布尔 disabled', () => {
            render(AttrsTypes);
            expect(screen.getByRole('button')).toHaveAttribute('data-foo', '1');
            expect(screen.getByRole('button', { name: 'a' })).toHaveAttribute('id', 'x');
        });
    });
});
