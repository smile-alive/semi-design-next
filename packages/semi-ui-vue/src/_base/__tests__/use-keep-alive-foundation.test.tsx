/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import useKeepAliveFoundation from '../use-keep-alive-foundation';

function mount(options: { override?: boolean } = {}) {
    const log: string[] = [];
    const active = ref(true);
    let isDeactivated!: () => boolean;
    const foundation = {
        connect: () => log.push('connect'),
        disconnect: () => log.push('disconnect'),
        init: () => log.push('init'),
        destroy: () => log.push('destroy'),
    };
    const Probe = defineComponent({
        setup() {
            ({ isDeactivated } = useKeepAliveFoundation(foundation, options.override ? { reactivate: () => log.push('reactivate') } : {}));
            return () => <div />;
        },
    });
    render(defineComponent(() => () => <KeepAlive>{active.value ? <Probe /> : null}</KeepAlive>));
    return {
        log,
        isDeactivated: () => isDeactivated(),
        setActive: async (next: boolean) => {
            active.value = next;
            await nextTick();
        },
    };
}

describe('useKeepAliveFoundation', () => {
    it('首次挂载不重复建立，失活时释放，激活时 connect 后 init', async () => {
        const host = mount();
        expect(host.log).toEqual([]);
        expect(host.isDeactivated()).toBe(false);

        await host.setActive(false);
        expect(host.log).toEqual(['destroy', 'disconnect']);
        expect(host.isDeactivated()).toBe(true);

        await host.setActive(true);
        expect(host.log).toEqual(['destroy', 'disconnect', 'connect', 'init']);
        expect(host.isDeactivated()).toBe(false);
    });

    it('传入 reactivate 时激活只调用它', async () => {
        const host = mount({ override: true });
        await host.setActive(false);
        await host.setActive(true);
        expect(host.log).toEqual(['destroy', 'disconnect', 'reactivate']);
    });
});
