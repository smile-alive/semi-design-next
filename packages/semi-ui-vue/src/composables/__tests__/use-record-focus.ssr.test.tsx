/** @jsxImportSource vue */
import { defineComponent } from 'vue';
import { expect, it } from 'vite-plus/test';
import { renderOnServer } from '@test/utils/vue.ssr';
import useRecordFocus from '../use-record-focus';

it('服务端渲染时可见也不记录焦点', async () => {
    let recorded = 0;
    const Probe = defineComponent({
        setup() {
            useRecordFocus({ record: () => recorded++ }, () => true);
            return () => <div />;
        },
    });
    const { warnings } = await renderOnServer(() => <Probe />);
    expect(warnings).toEqual([]);
    expect(recorded).toBe(0);
});
