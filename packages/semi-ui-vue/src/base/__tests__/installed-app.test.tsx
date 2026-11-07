/** @jsxImportSource vue */
import { createApp, defineComponent, inject, render, useId } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { rootAppContext, setInstalledApp } from '../installed-app';

const Probe = defineComponent({
    setup: () => {
        const id = useId();
        const value = inject<string>('value', 'none');
        return () => <i id={id}>{value}</i>;
    },
});

function renderRoot(): HTMLElement {
    const host = document.createElement('div');
    const vnode = <Probe />;
    vnode.appContext = rootAppContext();
    render(vnode, host);
    return host;
}

afterEach(() => {
    setInstalledApp(null);
});

describe('rootAppContext', () => {
    it('每个命令式渲染根的 useId 不与其他根和应用重复', () => {
        const app = createApp(Probe);
        app.mount(document.createElement('div'));
        setInstalledApp(app);
        const ids = [renderRoot(), renderRoot()].map((host) => host.querySelector('i')?.id);
        expect(new Set([...ids, 'v-0']).size).toBe(3);
        app.unmount();
    });

    it('复制 config 时不读取 compilerOptions，并沿用原 config 的其他字段', () => {
        const app = createApp(Probe);
        app.config.idPrefix = 'app';
        // The dev build warns when compilerOptions is read; the root's config must not touch it
        const compilerOptions = vi.fn<() => object>(() => ({}));
        Object.defineProperty(app.config, 'compilerOptions', { get: compilerOptions, configurable: true });
        setInstalledApp(app);
        const context = rootAppContext();
        expect(compilerOptions).not.toHaveBeenCalled();
        expect(context.config.globalProperties).toBe(app.config.globalProperties);
        expect(context.config.idPrefix).toMatch(/^app-semi\d+$/);
        expect(app.config.idPrefix).toBe('app');
    });

    it('读取已安装 app 的 provide，没有安装时也能渲染', () => {
        expect(renderRoot().textContent).toBe('none');
        const app = createApp(Probe).provide('value', 'from app');
        setInstalledApp(app);
        expect(renderRoot().textContent).toBe('from app');
    });
});
