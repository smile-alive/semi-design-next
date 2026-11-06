import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import ToastApi, { type ToastApiHost } from '../toast-api-foundation';

type Options = { content?: string; type?: string; id?: string; top?: number; zIndex?: number; stack?: boolean | number; getPopupContainer?: () => HTMLElement };

function setup(globalDefaults: Record<string, unknown> = {}, initialConfig?: ConstructorParameters<typeof ToastApi>[1]) {
    const unmount = vi.fn<() => void>();
    const mount = vi.fn<ToastApiHost['mount']>(() => unmount);
    const assertClient = vi.fn<() => void>();
    const api = new ToastApi<Options>({ assertClient, readGlobalDefaults: () => globalDefaults, mount }, initialConfig);
    const store = () => mount.mock.calls[0][1];
    return { api, mount, unmount, assertClient, store };
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('ToastApi', () => {
    it('第一个 Toast 创建并挂载 wrapper，之后复用；wrapper 带层级与位置', () => {
        const { api, mount, assertClient } = setup();
        const id = api.create({ content: 'a', top: 20, zIndex: 2000 });
        const wrapper = document.querySelector<HTMLElement>('.semi-toast-wrapper');
        expect(wrapper.id).toBe(api.getWrapperId());
        expect(wrapper.style.zIndex).toBe('2000');
        expect(wrapper.style.top).toBe('20px');
        expect(id).toMatch(/^toast-/);
        api.create({ content: 'b' });
        expect(assertClient).toHaveBeenCalledTimes(2);
        expect(mount).toHaveBeenCalledTimes(1);
        expect(document.querySelectorAll('.semi-toast-wrapper')).toHaveLength(1);
    });

    it('默认值层级：内置默认、全局默认、调用参数依次覆盖，显式 undefined 不覆盖', () => {
        const { api, store } = setup({ duration: 8, theme: 'light' }, { duration: 5 });
        api.create({ content: 'a', theme: undefined } as Options);
        const [shown] = store().getSnapshot().list;
        expect(shown).toMatchObject({ content: 'a', duration: 8, theme: 'light', zIndex: 1010 });
        api.create({ content: 'b', id: 'b', duration: 1 } as Options);
        expect(store().getSnapshot().list[1]).toMatchObject({ id: 'b', duration: 1 });
    });

    it('stack 写入列表，info 等快捷方法写入 type，字符串作为 content', () => {
        const { api, store } = setup();
        api.success({ content: 'a', stack: true } as Options);
        expect(store().getSnapshot().stack).toBe(3);
        api.info('plain');
        expect(
            store()
                .getSnapshot()
                .list.map(({ type, content }) => [type, content])
        ).toEqual([
            ['success', 'a'],
            ['info', 'plain'],
        ]);
    });

    it('getPopupContainer 决定 wrapper 挂载位置', () => {
        const { api } = setup();
        const container = document.body.appendChild(document.createElement('section'));
        api.create({ content: 'a', getPopupContainer: () => container });
        expect(container.querySelector('.semi-toast-wrapper')).not.toBeNull();
    });

    it('destroyAll 卸载并移除 wrapper、清空列表；没有 wrapper 时什么也不做，之后可重新创建', () => {
        const { api, mount, unmount, store } = setup();
        api.destroyAll();
        expect(unmount).not.toHaveBeenCalled();
        api.create({ content: 'a' });
        const first = store();
        api.destroyAll();
        expect(unmount).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.semi-toast-wrapper')).toBeNull();
        expect(api.getWrapperId()).toBeNull();
        expect(first.getSnapshot().list).toEqual([]);
        api.create({ content: 'b' });
        expect(mount).toHaveBeenCalledTimes(2);
    });

    it('close 移除指定 Toast；resetConfig 回到创建时的配置', () => {
        const { api, store } = setup({}, { duration: 5 });
        const id = api.create({ content: 'a' });
        api.close(id);
        expect(store().getSnapshot().list).toEqual([]);
        api.config({ duration: 9 });
        expect(api.defaultOpts.duration).toBe(9);
        api.resetConfig();
        expect(api.defaultOpts.duration).toBe(5);
    });
});
