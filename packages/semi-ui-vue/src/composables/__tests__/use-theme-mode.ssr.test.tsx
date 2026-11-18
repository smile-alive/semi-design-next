/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import useThemeMode from '../use-theme-mode';

const Probe = defineComponent({
    setup() {
        const { mode, preference } = useThemeMode();
        return () => (
            <span>
                {mode.value}/{preference.value}
            </span>
        );
    },
});

it('服务端渲染时 useThemeMode 为 light', async () => {
    const { html, warnings } = await renderOnServer(() => <Probe />);
    expect(warnings).toEqual([]);
    expect(html).toContain('light/light');
});
