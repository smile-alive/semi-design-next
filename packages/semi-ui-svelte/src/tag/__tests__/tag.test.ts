import { flushSync } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
import { createStore } from '../../_base/__tests__/store.svelte';
import semiGlobal from '../../_utils/semi-global';
import type { TagCloseEvent, TagProps } from '../interface';
import TagFixture from './tag-fixture.svelte';
import TagModes from './tag-modes.svelte';

const prefix = 'semi-tag';

type Store = { props: TagProps; label?: string; node?: boolean; icons?: boolean };

function setup(props: TagProps = {}, extra: Omit<Store, 'props'> = {}) {
    const store = createStore<Store>({ props, ...extra });
    const view = render(TagFixture, { props: { store } });
    return { store, container: view.container, root: view.container.querySelector(`.${prefix}`) as HTMLElement };
}

const closeIcon = (container: Element) => container.querySelector(`.${prefix}-close`) as HTMLElement;

afterEach(() => {
    semiGlobal.config = {};
});

describe('Svelte Tag 受控值（$bindable visible）', () => {
    const modes = (mode: 'bind' | 'function' | 'one-way' | 'uncontrolled', visible?: boolean, accept = true) => {
        const store = createStore<{ visible: boolean | undefined; accept: boolean; log: string[] }>({ visible, accept, log: [] });
        render(TagModes, { props: { mode, store } });
        const tag = screen.getByRole('button');
        const close = async () => {
            await fireEvent.keyDown(tag, { key: 'Delete' });
            flushSync();
        };
        return { store, tag, close };
    };

    it('非受控：关闭后隐藏并通知 onClose', async () => {
        const { store, tag, close } = modes('uncontrolled');
        await close();
        expect(tag).toHaveClass(`${prefix}-invisible`);
        expect(store.log).toEqual(['close']);
    });

    it('bind:visible：关闭写回父级，父级改值同步到组件', async () => {
        const { store, tag, close } = modes('bind', true);
        await close();
        expect(store.visible).toBe(false);
        expect(tag).toHaveClass(`${prefix}-invisible`);
        store.visible = true;
        flushSync();
        expect(tag).not.toHaveClass(`${prefix}-invisible`);
    });

    it('bind:visible 重置为 undefined 后重新显示，可以再次关闭', async () => {
        const { store, tag, close } = modes('bind', true);
        await close();
        store.visible = undefined;
        flushSync();
        expect(tag).not.toHaveClass(`${prefix}-invisible`);
        await close();
        expect(tag).toHaveClass(`${prefix}-invisible`);
    });

    it('函数绑定：setter 拒绝时标签保持显示', async () => {
        const { store, tag, close } = modes('function', true, false);
        await close();
        expect(store.log).toEqual(['close', 'set false']);
        expect(store.visible).toBe(true);
        expect(tag).not.toHaveClass(`${prefix}-invisible`);
    });

    it('函数绑定：setter 接受时标签跟随', async () => {
        const { store, tag, close } = modes('function', true, true);
        await close();
        expect(store.visible).toBe(false);
        expect(tag).toHaveClass(`${prefix}-invisible`);
    });

    it('单向传值：组件在本地覆盖，父级值不变；父级再推值时覆盖本地', async () => {
        const { store, tag, close } = modes('one-way', true);
        await close();
        expect(store.visible).toBe(true);
        expect(tag).toHaveClass(`${prefix}-invisible`);
        store.visible = false;
        flushSync();
        store.visible = true;
        flushSync();
        expect(tag).not.toHaveClass(`${prefix}-invisible`);
    });
});

describe('Svelte Tag', () => {
    it('关闭图标发出原生 click 事件与 tagKey，标签隐藏', async () => {
        const close = vi.fn<(event: TagCloseEvent, tagKey?: string | number) => void>();
        const { container, root } = setup({ closable: true, tagKey: 'k', onClose: close });
        await fireEvent.click(closeIcon(container));
        flushSync();
        expect(close).toHaveBeenCalledWith(expect.any(MouseEvent), 'k');
        expect(root).toHaveClass(`${prefix}-invisible`);
    });

    it('onClose 里 preventDefault 阻止隐藏', async () => {
        const { container, root } = setup({ closable: true, onClose: (event) => event.preventDefault() });
        await fireEvent.click(closeIcon(container));
        flushSync();
        expect(root).not.toHaveClass(`${prefix}-invisible`);
    });

    it('静态标签不进入 Tab 顺序，没有角色与可访问名称', () => {
        const { root } = setup();
        expect(root).not.toHaveAttribute('role');
        expect(root).not.toHaveAttribute('tabindex');
        expect(root).not.toHaveAttribute('aria-label');
    });

    it.each(['Enter', ' '])('%s 激活 click 并阻止浏览器默认操作', async (key) => {
        const click = vi.fn<(event: MouseEvent) => void>();
        setup({ onclick: click });
        const tag = screen.getByRole('button');
        expect(tag).toHaveAttribute('tabindex', '0');
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        await fireEvent(tag, event);
        expect(event.defaultPrevented).toBe(true);
        expect(click).toHaveBeenCalledTimes(1);
    });

    it.each(['Backspace', 'Delete'])('%s 关闭后仍通知 onkeydown，关闭图标不冒泡 click', async (key) => {
        const keydown = vi.fn<(event: KeyboardEvent) => void>();
        const click = vi.fn<(event: MouseEvent) => void>();
        const { container } = setup({ closable: true, onkeydown: keydown, onclick: click });
        const tag = screen.getByRole('button');
        await fireEvent.keyDown(tag, { key });
        flushSync();
        expect(keydown).toHaveBeenCalledTimes(1);
        expect(tag).toHaveClass(`${prefix}-invisible`);
        await fireEvent.click(closeIcon(container));
        expect(click).not.toHaveBeenCalled();
    });

    it('字符串内容生成语言包名称，使用方名称和 tabindex 优先', async () => {
        const { store } = setup({ closable: true, tabindex: -1 });
        const tag = screen.getByRole('button');
        expect(tag).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.replace('${tag}', 'semi'));
        expect(tag).toHaveAttribute('tabindex', '-1');
        store.props['aria-label'] = 'custom';
        flushSync();
        expect(tag).toHaveAttribute('aria-label', 'custom');
    });

    it('可点击但不可关闭的标签使用 tag 名称', () => {
        setup({ onclick: () => {} });
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', zh_CN.Tag.tag.replace('${tag}', 'semi'));
    });

    it('文本里的 $&、$$ 按原文写入 aria-label，不当作替换模式', () => {
        setup({ closable: true }, { label: '$&-$$' });
        expect(screen.getByRole('button')).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.split('${tag}').join('$&-$$'));
    });

    it('非字符串内容不生成空名称，并渲染图标插槽', () => {
        const { container } = setup({ closable: true }, { node: true, icons: true });
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
        expect(container.querySelector('[x-semi-prop="prefixIcon"]')).toHaveTextContent('prefix');
        expect(container.querySelector('[x-semi-prop="suffixIcon"]')).toHaveTextContent('suffix');
        expect(container.querySelector(`.${prefix}-content`)).toHaveClass(`${prefix}-content-center`);
    });

    it('内容在文本与元素之间切换时，名称与省略样式随之更新', async () => {
        const { store, container } = setup({ closable: true });
        const content = container.querySelector(`.${prefix}-content`);
        expect(content).toHaveClass(`${prefix}-content-ellipsis`);
        store.node = true;
        await waitFor(() => expect(content).toHaveClass(`${prefix}-content-center`));
        expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
        store.node = false;
        store.label = 'next';
        await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-label', zh_CN.Tag.closableTag.replace('${tag}', 'next')));
    });

    it('读取全局默认值并透传原生属性', () => {
        semiGlobal.config = { overrideDefaultProps: { Tag: { color: 'red', size: 'large', closable: true } } };
        const { root } = setup({ id: 'tag-id', 'data-check': 'tag', class: 'custom' } as TagProps);
        expect(root).toHaveClass(`${prefix}-red-light`, `${prefix}-large`, 'custom');
        expect(root).toHaveAttribute('id', 'tag-id');
        expect(root).toHaveAttribute('data-check', 'tag');
        expect(root).toHaveAttribute('role', 'button');
    });

    it('头像图片是装饰性内容', () => {
        const { container, root } = setup({ avatarSrc: 'avatar.png', avatarShape: 'circle' });
        expect(container.querySelector('img')).toHaveAttribute('alt', '');
        expect(root).toHaveClass(`${prefix}-avatar-circle`);
    });

    it('尺寸、形状、类型与配色属性控制类名', () => {
        const { root } = setup({ size: 'small', shape: 'circle', type: 'solid', color: 'blue', colorful: true, gradient: true, visible: false });
        expect(root).toHaveClass(`${prefix}-small`, `${prefix}-circle`, `${prefix}-solid`, `${prefix}-blue-solid`, `${prefix}-colorful`, `${prefix}-gradient`, `${prefix}-invisible`);
    });
});
