import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import Button from '../button.svelte';
import ButtonCase from './button-case.svelte';
import FormSubmit from './form-submit.svelte';
import GroupCase from './group-case.svelte';

type Handler = (event: MouseEvent) => void;
const prefixCls = `${BASE_CLASS_PREFIX}-button`;
type Case = NonNullable<Parameters<typeof ButtonCase>[1]>['store'];
type GroupStore = NonNullable<Parameters<typeof GroupCase>[1]>['store'];

function setup(initial: Case) {
    const store = createStore<Case>({ ...initial, props: { ...initial.props } });
    const view = render(ButtonCase, { props: { store } });
    return { store, view };
}
function setupGroup(initial: GroupStore) {
    const store = createStore<GroupStore>(initial);
    const view = render(GroupCase, { props: { store } });
    return { store, view };
}
const lines = () => document.querySelectorAll(`.${prefixCls}-group-line`);
const readFill = (): unknown => JSON.parse(screen.getByTestId('icon').dataset.fill ?? 'null');
const multiple = [3, 2, 1, 0].map((level, i) => `var(--semi-button-colorful-multiple-fill-${i}, var(--semi-ai-general-5-${level}))`);

describe('Svelte Button', () => {
    // a whitespace node after the button widens the gap between inline buttons, which the other frameworks do not have
    it('按钮外不留空白文本节点', () => {
        const { container } = render(Button);
        const blank = [...container.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent !== '' && node.textContent?.trim() === '');
        expect(blank).toHaveLength(0);
    });

    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('自定义 class 与 style 落在原生 button', () => {
        setup({ props: { class: 'test', style: 'color: red' }, text: 'x' });
        const button = screen.getByRole('button');
        expect(button).toHaveClass('test');
        expect(button).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('带 icon 的 button', () => {
        const { view } = setup({ icon: 'edit' });
        expect(view.container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-with-icon`, `${prefixCls}-with-icon-only`);
    });

    it('水平内边距，布尔与数组都生效，无 icon 时不生效', () => {
        const { store } = setup({ props: { noHorizontalPadding: true }, icon: 'edit' });
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '0px' });
        store.props = { noHorizontalPadding: 'left' };
        flushSync();
        expect(screen.getByRole('button').style.paddingLeft).toBe('0px');
        expect(screen.getByRole('button').style.paddingRight).toBe('');
        store.icon = undefined;
        store.text = 'x';
        flushSync();
        expect(screen.getByRole('button').style.paddingLeft).toBe('');
    });

    it('有 icon 时组件的内边距优先于 style', () => {
        setup({ props: { noHorizontalPadding: 'left', style: 'padding-left: 8px; padding-right: 8px' }, icon: 'edit' });
        expect(screen.getByRole('button')).toHaveStyle({ paddingLeft: '0px', paddingRight: '8px' });
    });

    it('button 类型', () => {
        const { store } = setup({ text: 'x' });
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
        for (const htmlType of ['reset', 'submit'] as const) {
            store.props = { htmlType };
            flushSync();
            expect(screen.getByRole('button')).toHaveAttribute('type', htmlType);
        }
    });

    it('iconPosition 决定图标与文字的顺序', () => {
        const { view } = setup({ props: { iconPosition: 'right' }, icon: 'edit', text: 'x' });
        expect(view.container.querySelectorAll(`.${prefixCls}-content-left`)).toHaveLength(1);
        expect(view.container.querySelectorAll(`.${prefixCls}-content-right`)).toHaveLength(0);
        expect(view.container.querySelector(`.${prefixCls}-content`)?.firstElementChild).toHaveTextContent('x');
    });

    it('disabled 同时设置 disabled 与 aria-disabled，并切换类型 class', () => {
        setup({ props: { type: 'danger', disabled: true, theme: 'solid' }, text: 'x' });
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).toHaveClass(`${prefixCls}-disabled`, `${prefixCls}-danger-disabled`, `${prefixCls}-solid`);
        expect(button).not.toHaveClass(`${prefixCls}-danger`);
    });

    it('icon 布局时文本 span 带 x-semi-prop，内容 span 不带；无 icon 时内容 span 带', () => {
        const { store, view } = setup({ icon: 'edit', text: 'x' });
        const content = view.container.querySelector(`.${prefixCls}-content`) as HTMLElement;
        expect(content).not.toHaveAttribute('x-semi-prop');
        expect(content.querySelector('[x-semi-prop="children"]')).toHaveTextContent('x');
        store.icon = undefined;
        flushSync();
        expect(document.querySelector(`.${prefixCls}-content`)).toHaveAttribute('x-semi-prop', 'children');
    });

    it('loading 时渲染 spinner，除非按钮为 disabled', () => {
        const { store, view } = setup({ props: { loading: true }, text: 'x' });
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-loading`, `${prefixCls}-with-icon`);
        expect(view.container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);
        store.props = { loading: true, disabled: true };
        flushSync();
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-with-icon`);
        expect(view.container.querySelectorAll('[data-icon="spin"]')).toHaveLength(0);
    });

    it('loading 取代 icon，disabled 加 loading 时仍显示 icon 且没有 loading 类', () => {
        const { store, view } = setup({ props: { loading: true }, icon: 'edit' });
        expect(view.container.querySelectorAll('[data-icon="spin"]')).toHaveLength(1);
        expect(view.container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(0);
        store.props = { loading: true, disabled: true };
        flushSync();
        expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-loading`);
        expect(view.container.querySelectorAll('[data-icon="spin"]')).toHaveLength(0);
        expect(view.container.querySelectorAll(`.${BASE_CLASS_PREFIX}-icon-edit`)).toHaveLength(1);
    });

    it('loading 时点击不触发 click，按钮标记 aria-disabled 且仍可聚焦，恢复后触发一次', async () => {
        const onclick = vi.fn<Handler>();
        const onclickcapture = vi.fn<Handler>();
        const { store } = setup({ props: { loading: true, onclick, onclickcapture }, text: 'x' });
        const button = screen.getByRole('button');
        await fireEvent.click(button);
        expect(onclick).not.toHaveBeenCalled();
        expect(onclickcapture).not.toHaveBeenCalled();
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toBeDisabled();
        button.focus();
        expect(button).toHaveFocus();
        store.props = { loading: false, onclick, onclickcapture };
        flushSync();
        await fireEvent.click(button);
        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclickcapture).toHaveBeenCalledTimes(1);
    });

    it('loading 时 submit 按钮不提交表单，恢复后提交', async () => {
        const store = createStore({ loading: true, submitted: 0 });
        render(FormSubmit, { props: { store } });
        const button = screen.getByRole('button');
        await fireEvent.click(button);
        expect(store.submitted).toBe(0);
        store.loading = false;
        flushSync();
        await fireEvent.click(button);
        expect(store.submitted).toBe(1);
    });

    it('colorful 图标使用多色或双色填充', () => {
        const { store } = setup({ props: { type: 'tertiary', colorful: true, theme: 'solid' }, icon: 'probe' });
        expect(readFill()).toEqual(multiple);
        store.props = { type: 'tertiary', colorful: true, theme: 'solid', disabled: true };
        flushSync();
        expect(readFill()).toEqual(Array(4).fill('var(--semi-color-disabled-text)'));
        store.props = { type: 'tertiary', colorful: true, theme: 'outline' };
        flushSync();
        expect(readFill()).toEqual(['var(--semi-button-colorful-fill-primary, var(--semi-color-ai-purple))', 'var(--semi-button-colorful-fill-secondary, var(--semi-color-text-0))']);
        store.props = { type: 'primary', colorful: true, theme: 'solid' };
        flushSync();
        expect(readFill()).toBeNull();
    });

    it('colorful 不传 theme、type 时仍得到多色填充与 AI loading 图标', () => {
        const { store } = setup({ props: { colorful: true }, icon: 'probe' });
        expect(readFill()).toEqual(multiple);
        store.props = { colorful: true, loading: true };
        flushSync();
        expect(document.querySelector(`.${prefixCls}-content-loading-icon`)).toBeInTheDocument();
    });

    it('原生属性与事件落在原生 button，使用方 aria-disabled 不能覆盖计算值', async () => {
        const onmouseenter = vi.fn<Handler>();
        setup({ props: { id: 'b', title: 't', 'aria-label': 'label', 'data-foo': '1', 'aria-disabled': 'false', loading: true, onmouseenter } });
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('id', 'b');
        expect(button).toHaveAttribute('title', 't');
        expect(button).toHaveAttribute('data-foo', '1');
        expect(button).toHaveAttribute('aria-disabled', 'true');
        await fireEvent.mouseEnter(button);
        expect(onmouseenter).toHaveBeenCalledTimes(1);
    });

    it('contentClassName 落在内容 span，且不进入 DOM 属性', () => {
        setup({ props: { contentClassName: 'inner' }, text: 'x' });
        expect(screen.getByRole('button')).not.toHaveAttribute('contentclassname');
        expect(document.querySelector(`.${prefixCls}-content`)).toHaveClass('inner');
    });

    it('loading 与 icon 切换时原生 button 是同一个元素', () => {
        const { store } = setup({ text: 'x' });
        const button = screen.getByRole('button');
        store.props = { loading: true };
        flushSync();
        expect(screen.getByRole('button')).toBe(button);
        store.icon = 'edit';
        flushSync();
        expect(screen.getByRole('button')).toBe(button);
        expect(button).toHaveClass(`${prefixCls}-with-icon`);
    });

    describe('全局默认值', () => {
        it('从 overrideDefaultProps.Button 读取，自身值优先', () => {
            semiGlobal.config.overrideDefaultProps = { Button: { theme: 'solid', type: 'danger', size: 'large', block: true, htmlType: 'submit', loading: true } };
            const { store } = setup({ text: 'x' });
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-large`, `${prefixCls}-solid`, `${prefixCls}-danger`, `${prefixCls}-block`, `${prefixCls}-loading`);
            expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
            store.props = { type: 'primary' };
            flushSync();
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-solid`, `${prefixCls}-primary`);
        });

        it('全局 disabled 与 colorful 生效，自身 disabled=false 胜过全局 true', () => {
            semiGlobal.config.overrideDefaultProps = { Button: { disabled: true, colorful: true } };
            const { store } = setup({ text: 'x' });
            expect(screen.getByRole('button')).toBeDisabled();
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-colorful`);
            store.props = { disabled: false };
            flushSync();
            expect(screen.getByRole('button')).toBeEnabled();
        });

        it('IconButton 键只作用于 IconButton', () => {
            semiGlobal.config.overrideDefaultProps = { IconButton: { type: 'danger', block: true, loading: true } };
            setup({ text: 'x' });
            expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-primary`);
            expect(screen.getByRole('button')).not.toHaveClass(`${prefixCls}-block`);
        });
    });
});

describe('Svelte ButtonGroup', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('根元素是 role=group，自定义 class、style 与其他属性落在根元素', () => {
        setupGroup({ group: { class: 'test', style: 'color: red', id: 'g', 'data-foo': 'bar', 'aria-label': 'actions' }, items: [{ label: 'a' }] });
        const el = screen.getByRole('group', { name: 'actions' });
        expect(el).toHaveClass('test', `${prefixCls}-group`);
        expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(el).toHaveAttribute('data-foo', 'bar');
        expect(screen.getByRole('button')).not.toHaveAttribute('data-foo');
    });

    it('使用方传入的 role 覆盖默认的 group', () => {
        setupGroup({ group: { role: 'toolbar' }, items: [] });
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('组的属性作为默认值，子按钮自身的值优先，分隔线读有效值', () => {
        setupGroup({
            group: { type: 'danger', colorful: true, size: 'small', theme: 'solid' },
            items: [{ label: 'a', props: { type: 'primary', theme: 'light' } }, { label: 'b' }, { label: 'c', props: { theme: 'outline' } }],
        });
        const [a, b, c] = screen.getAllByRole('button');
        expect(a).toHaveClass(`${prefixCls}-primary`, `${prefixCls}-light`, `${prefixCls}-size-small`);
        expect(a).not.toHaveClass(`${prefixCls}-solid`);
        expect(b).toHaveClass(`${prefixCls}-danger`, `${prefixCls}-solid`, `${prefixCls}-colorful`);
        expect(c).toHaveClass(`${prefixCls}-outline`);
        expect(lines()).toHaveLength(2);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines()[1]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('分隔线跟随组的 disabled，outline 按钮与末项之后没有分隔线', () => {
        setupGroup({ group: { disabled: true, theme: 'solid', type: 'danger' }, items: [{ label: 'a' }, { label: 'b' }] });
        expect(lines()).toHaveLength(1);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`, `${prefixCls}-group-line-disabled`);
    });

    it('outline 按钮后不绘制分隔线', () => {
        setupGroup({ items: [{ label: 'a', props: { theme: 'outline' } }, { label: 'b' }, { label: 'c', props: { disabled: true } }] });
        expect(lines()).toHaveLength(1);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-light`, `${prefixCls}-group-line-primary`);
        expect(lines()[0]).not.toHaveClass(`${prefixCls}-group-line-disabled`);
    });

    it('IconButton 之后也有分隔线，并继承组值', () => {
        setupGroup({ group: { type: 'danger', theme: 'solid' }, items: [{ kind: 'icon-button', label: 'a' }, { kind: 'icon-button', label: 'b', props: { theme: 'outline' } }, { kind: 'icon-button', label: 'c' }, { label: 'd' }] });
        expect(screen.getAllByRole('button')[0]).toHaveClass(`${prefixCls}-danger`);
        expect(lines()).toHaveLength(2);
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
        expect(screen.getByRole('group').children[1]).toBe(lines()[0]);
    });

    it('IconButton 之后的分隔线读全局 IconButton 键', () => {
        semiGlobal.config.overrideDefaultProps = { IconButton: { theme: 'solid', type: 'danger' } };
        setupGroup({ items: [{ kind: 'icon-button', label: 'a' }, { label: 'b' }] });
        expect(lines()[0]).toHaveClass(`${prefixCls}-group-line-solid`, `${prefixCls}-group-line-danger`);
    });

    it('分隔线数量覆盖空组、单个按钮、增删与重排', async () => {
        const { store } = setupGroup({ items: [] });
        expect(lines()).toHaveLength(0);
        store.items = [{ label: 'a' }];
        flushSync();
        expect(lines()).toHaveLength(0);
        store.items = [{ label: 'a' }, { label: 'b' }, { label: 'c' }];
        flushSync();
        const a = screen.getByRole('button', { name: 'a' });
        expect(lines()).toHaveLength(2);
        store.items = [{ label: 'c' }, { label: 'a' }, { label: 'b' }];
        flushSync();
        expect(screen.getByRole('button', { name: 'a' })).toBe(a);
        expect(screen.getAllByRole('button').map((el) => el.textContent)).toEqual(['c', 'a', 'b']);
        // the group re-reads the button order from a MutationObserver callback
        await waitFor(() => expect(screen.getByRole('button', { name: 'c' }).nextElementSibling).toBe(lines()[0]));
        expect(screen.getByRole('button', { name: 'b' }).nextElementSibling).toBeNull();
        expect(lines()).toHaveLength(2);
        store.items = [{ label: 'c' }, { label: 'a' }];
        flushSync();
        await waitFor(() => expect(lines()).toHaveLength(1));
    });

    it('在中间插入按钮后分隔线仍只在末项之前', () => {
        const { store } = setupGroup({ items: [{ label: 'a' }, { label: 'c' }] });
        store.items = [{ label: 'a' }, { label: 'b' }, { label: 'c' }];
        flushSync();
        expect(lines()).toHaveLength(2);
        expect(screen.getByRole('group').lastElementChild).toBe(screen.getByRole('button', { name: 'c' }));
    });

    it('ButtonGroup 全局键作为组默认值', () => {
        semiGlobal.config.overrideDefaultProps = { ButtonGroup: { size: 'small' } };
        setupGroup({ items: [{ label: 'a' }] });
        expect(screen.getByRole('button')).toHaveClass(`${prefixCls}-size-small`);
    });

    it('自身 false 胜过组 true，undefined 才吃组值', () => {
        setupGroup({
            group: { disabled: true, type: 'danger' },
            items: [
                { label: 'own', props: { disabled: false } },
                { label: 'empty', props: { disabled: undefined, type: undefined } },
            ],
        });
        const [own, empty] = screen.getAllByRole('button');
        expect(own).toBeEnabled();
        expect(empty).toBeDisabled();
        expect(empty).toHaveClass(`${prefixCls}-danger-disabled`);
    });

    it('嵌套 ButtonGroup 继承外层，内层自身值优先', () => {
        setupGroup({ group: { disabled: true, type: 'danger', size: 'small' }, items: [], nested: { type: 'warning' } });
        const [nested, own] = screen.getAllByRole('button');
        expect(nested).toBeDisabled();
        expect(nested).toHaveClass(`${prefixCls}-warning-disabled`, `${prefixCls}-size-small`);
        expect(own).toHaveClass(`${prefixCls}-secondary-disabled`);
    });
});
