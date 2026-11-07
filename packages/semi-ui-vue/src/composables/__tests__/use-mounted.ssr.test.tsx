/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import useMounted from '../use-mounted';

const Probe = defineComponent({
    setup() {
        const mounted = useMounted();
        return () => <span>{String(mounted.value)}</span>;
    },
});

it('服务端渲染时 useMounted 为 false', async () => {
    const { html, warnings } = await renderOnServer(() => <Probe />);
    expect(warnings).toEqual([]);
    expect(html).toContain('<span>false</span>');
});
