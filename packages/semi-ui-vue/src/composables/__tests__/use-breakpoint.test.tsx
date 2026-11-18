/** @jsxImportSource vue */
import { createSSRApp, defineComponent, nextTick } from 'vue';
import { screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { defaultResponsiveMap } from '@fibrae/semi-foundation/components/grid/constants';
import { mockMatchMedia, render } from '@test/utils/vue';
import { renderOnServer } from '@test/utils/vue.ssr';
import useBreakpoint from '../use-breakpoint';

const Probe = defineComponent({
    setup() {
        const screens = useBreakpoint();
        return () => (
            <p>
                {Object.keys(screens.value)
                    .filter((key) => screens.value[key as keyof typeof screens.value])
                    .join(',') || 'none'}
            </p>
        );
    },
});

describe('useBreakpoint', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.replaceChildren();
    });

    it('挂载后读取命中的断点，并跟随媒体查询变化；卸载后移除监听', async () => {
        const matching = [defaultResponsiveMap.sm, defaultResponsiveMap.md];
        const media = mockMatchMedia(matching);
        const view = render(Probe);
        await nextTick();
        expect(screen.getByText('sm,md')).toBeTruthy();
        matching.push(defaultResponsiveMap.lg);
        await media.fire(defaultResponsiveMap.lg, true);
        expect(screen.getByText('sm,md,lg')).toBeTruthy();
        view.unmount();
        expect(media.totalHandlers()).toBe(0);
    });

    it('hydration 先渲染全部为 false 且无告警，再换成实际断点', async () => {
        const { html } = await renderOnServer(() => <Probe />);
        expect(html).toContain('<p>none</p>');
        mockMatchMedia([defaultResponsiveMap.sm]);
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
        expect(container).toHaveTextContent('sm');
        app.unmount();
    });
});
