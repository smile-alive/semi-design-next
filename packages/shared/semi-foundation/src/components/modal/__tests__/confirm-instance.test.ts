import { describe, expect, it, vi } from 'vite-plus/test';
import ConfirmInstance from '../confirm-instance';
import ConfirmRegistry from '../confirm-registry';

interface Config {
    title?: string;
    visible?: boolean;
    afterClose?: () => void;
}

function create(config: Config = {}, registry?: ConfirmRegistry) {
    const render = vi.fn<(props: Config) => void>();
    const remove = vi.fn<() => void>();
    const instance = new ConfirmInstance<Config>(config, { render, remove }, registry);
    return { instance, render, remove };
}

describe('ConfirmInstance', () => {
    it('update 合并配置后重新渲染，渲染的 afterClose 是实例自己的', () => {
        const afterClose = vi.fn<() => void>();
        const { instance, render } = create({ title: 'a', afterClose });
        instance.update({ title: 'b' });
        expect(render).toHaveBeenLastCalledWith({ title: 'b', afterClose: instance.handleAfterClose });
    });

    it('挂载后 close 渲染隐藏，afterClose 调用最新的回调一次并移除', () => {
        const first = vi.fn<() => void>();
        const latest = vi.fn<() => void>();
        const { instance, render, remove } = create({ afterClose: first });
        instance.handleMount();
        instance.handle.update({ afterClose: latest });
        instance.handle.destroy();
        expect(render).toHaveBeenLastCalledWith(expect.objectContaining({ visible: false }));
        expect(remove).not.toHaveBeenCalled();
        instance.handleAfterClose();
        instance.handleAfterClose();
        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledTimes(1);
    });

    it('挂载前 close 不再渲染，直接调用 afterClose 并移除', () => {
        const afterClose = vi.fn<() => void>();
        const { instance, render, remove } = create({ afterClose });
        instance.close();
        expect(render).not.toHaveBeenCalled();
        expect(afterClose).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledTimes(1);
    });

    it('结束后的 update 与 close 不再渲染', () => {
        const { instance, render, remove } = create();
        instance.close();
        instance.update({ title: 'late' });
        instance.close();
        expect(render).not.toHaveBeenCalled();
        expect(remove).toHaveBeenCalledTimes(1);
    });

    it('传入注册表时 destroyAll 能关闭它', () => {
        const registry = new ConfirmRegistry();
        const { instance, render } = create({}, registry);
        instance.handleMount();
        registry.destroyAll();
        expect(render).toHaveBeenLastCalledWith(expect.objectContaining({ visible: false }));
    });
});
