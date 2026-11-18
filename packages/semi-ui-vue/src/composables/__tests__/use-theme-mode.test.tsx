/** @jsxImportSource vue */
import { createSSRApp, defineComponent, nextTick } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import { renderOnServer } from '@test/utils/vue.ssr';
import useThemeMode from '../use-theme-mode';

const Probe = defineComponent({
    setup() {
        const { mode, preference, setMode } = useThemeMode();
        return () => (
            <button type="button" onClick={() => setMode(mode.value === 'dark' ? 'light' : 'dark')}>
                {mode.value}/{preference.value}
            </button>
        );
    },
});

describe('useThemeMode', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('theme-mode');
        document.body.replaceChildren();
    });

    it('读写 html 的 theme-mode，并反映页面直接写入的属性', async () => {
        render(Probe);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('light/light');
        button.click();
        await nextTick();
        expect(button).toHaveTextContent('dark/dark');
        expect(document.documentElement).toHaveAttribute('theme-mode', 'dark');
        document.documentElement.removeAttribute('theme-mode');
        await new Promise((resolve) => setTimeout(resolve));
        await nextTick();
        expect(button).toHaveTextContent('light/light');
    });

    it('hydration 先渲染服务端的 light 且无告警，再换成页面的实际模式', async () => {
        const { html } = await renderOnServer(() => <Probe />);
        document.documentElement.setAttribute('theme-mode', 'dark');
        const container = document.body.appendChild(document.createElement('div'));
        container.innerHTML = html;
        const warnings: string[] = [];
        const app = createSSRApp(Probe);
        app.config.warnHandler = (message) => {
            warnings.push(message);
        };
        app.mount(container);
        expect(warnings).toEqual([]);
        await nextTick();
        expect(container).toHaveTextContent('dark/dark');
        app.unmount();
    });
});
