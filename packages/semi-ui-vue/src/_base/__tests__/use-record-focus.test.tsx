/** @jsxImportSource vue */
import { defineComponent, nextTick, onBeforeMount, onMounted, ref } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useRecordFocus from '../use-record-focus';

function setup(initial: boolean) {
    const calls: string[] = [];
    const visible = ref(initial);
    const Probe = defineComponent({
        setup() {
            useRecordFocus({ record: () => calls.push('record') }, () => visible.value);
            onBeforeMount(() => calls.push('beforeMount'));
            onMounted(() => calls.push('mounted'));
            return () => <div />;
        },
    });
    render(Probe);
    return { calls, visible };
}

describe('useRecordFocus', () => {
    it('首帧可见时在挂载前记录', () => {
        const { calls } = setup(true);
        expect(calls).toEqual(['record', 'beforeMount', 'mounted']);
    });

    it('首帧不可见时不记录，之后变为可见时记录', async () => {
        const { calls, visible } = setup(false);
        expect(calls).toEqual(['beforeMount', 'mounted']);
        visible.value = true;
        await nextTick();
        expect(calls).toEqual(['beforeMount', 'mounted', 'record']);
    });

    it('变为不可见时不记录', async () => {
        const { calls, visible } = setup(true);
        visible.value = false;
        await nextTick();
        expect(calls).toEqual(['record', 'beforeMount', 'mounted']);
    });
});
