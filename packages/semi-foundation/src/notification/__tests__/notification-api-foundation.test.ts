import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import NotificationApi, { type NotificationApiHost } from '../notification-api-foundation';

type Options = { title?: string; type?: string; id?: string; zIndex?: number; position?: string; getPopupContainer?: () => HTMLElement };

function setup(globalDefaults: Record<string, unknown> = {}) {
    const unmount = vi.fn<() => void>();
    const mount = vi.fn<NotificationApiHost['mount']>(() => unmount);
    const api = new NotificationApi<Options>({ assertClient: () => {}, readGlobalDefaults: () => globalDefaults, mount });
    const store = () => mount.mock.calls[0][1];
    return { api, mount, unmount, store };
}

afterEach(() => {
    document.body.replaceChildren();
});

describe('NotificationApi', () => {
    it('第一个通知创建并挂载 wrapper，之后复用；wrapper 带层级', () => {
        const { api, mount } = setup();
        const id = api.addNotice({ title: 'a', zIndex: 2000 });
        api.addNotice({ title: 'b' });
        expect(mount).toHaveBeenCalledTimes(1);
        const wrapper = document.querySelector<HTMLElement>('.semi-notification-wrapper');
        expect(wrapper.style.zIndex).toBe('1010');
        expect(id).toMatch(/^notification-/);
    });

    it('全局默认值（含位置）合并进通知，调用参数覆盖它，显式 undefined 不覆盖', () => {
        const { api, store } = setup({ position: 'bottomLeft', duration: 8 });
        api.info({ title: 'a', position: undefined });
        api.info({ title: 'b', position: 'top' });
        const [b, a] = store().getSnapshot().notices;
        expect(a).toMatchObject({ type: 'info', position: 'bottomLeft', duration: 8 });
        expect(b).toMatchObject({ position: 'top' });
    });

    it('open、success 等快捷方法写入 type，close 返回 id', () => {
        const { api, store } = setup();
        api.open({ title: 'a', id: 'a' });
        api.error({ title: 'b', id: 'b' });
        expect(
            store()
                .getSnapshot()
                .notices.map(({ id, type }) => [id, type])
        ).toEqual([
            ['b', 'error'],
            ['a', 'default'],
        ]);
        expect(api.close('a')).toBe('a');
        expect(
            store()
                .getSnapshot()
                .notices.map(({ id }) => id)
        ).toEqual(['b']);
    });

    it('destroyAll 卸载并移除 wrapper、清空列表，之后可重新创建', () => {
        const { api, mount, unmount, store } = setup();
        api.destroyAll();
        expect(unmount).not.toHaveBeenCalled();
        api.addNotice({ title: 'a' });
        const first = store();
        api.destroyAll();
        expect(unmount).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.semi-notification-wrapper')).toBeNull();
        expect(first.getSnapshot().notices).toEqual([]);
        api.addNotice({ title: 'b' });
        expect(mount).toHaveBeenCalledTimes(2);
    });
});
