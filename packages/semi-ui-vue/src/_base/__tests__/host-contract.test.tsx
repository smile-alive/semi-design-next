/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick, onMounted, onUpdated, ref } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { type ContractAdapter, type ContractHost, type ContractMountOptions, type ContractProps, type ContractState, ContractFoundation, defineHostContract, stateText } from '@test/utils/host-contract';
import { render } from '@test/utils/vue';
import useDidUpdate from '../use-did-update';
import useFoundation from '../use-foundation';

async function mount(options: ContractMountOptions & { wrapInKeepAlive?: boolean } = {}): Promise<ContractHost & { setActive: (active: boolean) => Promise<void> }> {
    if (options.strictMode) {
        throw new Error('Vue has no StrictMode');
    }
    const log: string[] = [];
    const commitContexts: string[] = [];
    let foundation: ContractFoundation;
    // the state the latest render read, promoted to `rendered` once the post-commit hook runs
    let readByRender: ContractState;
    let rendered: ContractState;
    const label = ref('a');
    const theme = ref(options.context ?? 'a');
    const active = ref(true);

    const Probe = defineComponent({
        props: { label: { type: String, default: undefined }, theme: { type: String, default: 'a' } },
        setup(props) {
            const { foundation: f, state } = useFoundation<ContractFoundation, ContractAdapter, ContractProps, ContractState>(
                ContractFoundation,
                props,
                () => ({ x: 0 }),
                () => ({
                    log: (entry) => {
                        log.push(entry);
                    },
                    notifyChange: (x) => {
                        const next = options.onChange?.(x);
                        if (next !== undefined) {
                            label.value = next;
                        }
                    },
                }),
                { context: () => ({ theme: props.theme }) }
            );
            foundation = f;
            useDidUpdate(
                () => props.label,
                () => f.handleLabelChange()
            );
            const commit = () => {
                rendered = readByRender;
                log.push('commit');
                commitContexts.push(f.getContext('theme'));
            };
            onMounted(commit);
            onUpdated(commit);
            return () => {
                readByRender = state.value;
                return (
                    <>
                        <span data-contract-state>{state.value.x}</span>
                        <span data-contract-label>{props.label}</span>
                    </>
                );
            };
        },
    });

    const probe = () => (active.value ? <Probe label={label.value} theme={theme.value} /> : null);
    const view = render(defineComponent(() => () => (options.wrapInKeepAlive ? <KeepAlive>{probe}</KeepAlive> : probe())));
    return {
        log,
        commitContexts,
        foundation: () => foundation,
        renderedState: () => rendered,
        setLabel: async (next) => {
            label.value = next;
            await nextTick();
        },
        setContext: async (next) => {
            theme.value = next;
            await nextTick();
        },
        setActive: async (next) => {
            active.value = next;
            await nextTick();
        },
        run: async (fn) => {
            fn(foundation);
            await nextTick();
        },
        unmount: async () => view.unmount(),
    };
}

describe('Vue useFoundation 宿主契约', () => {
    defineHostContract(mount, { strictMode: false });

    // useFoundation leaves KeepAlive deactivation to the components that call useKeepAliveFoundation, unlike React Activity
    it('KeepAlive 失活时不 destroy、signal 保持有效，激活时不重新 init', async () => {
        const host = await mount({ wrapInKeepAlive: true });
        await host.run((foundation) => foundation.setState({ x: 2 }));
        const foundation = host.foundation();
        await host.setActive(false);
        expect(stateText()).toBeNull();
        expect(host.log.filter((entry) => /^(init|destroy)/.test(entry))).toEqual(['init state=0']);
        expect(foundation.signals.map((signal) => signal.aborted)).toEqual([false]);
        await host.setActive(true);
        expect(host.log.filter((entry) => /^(init|destroy)/.test(entry))).toEqual(['init state=0']);
        expect(stateText()).toBe('2');
    });
});
