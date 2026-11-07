import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe } from 'vite-plus/test';
import { type ContractFoundation, type ContractHost, type ContractMountOptions, type ContractState, defineHostContract } from '@test/utils/host-contract';
import ContractHarness from './contract-harness.svelte';
import { createStore } from './store.svelte';

async function mount(options: ContractMountOptions = {}): Promise<ContractHost> {
    const log: string[] = [];
    const commitContexts: string[] = [];
    let foundation!: ContractFoundation;
    let rendered!: ContractState;
    const store = createStore({ label: 'a', theme: options.context ?? 'a' });
    const hooks = {
        log: (entry: string) => {
            log.push(entry);
        },
        notifyChange: (x: number) => {
            const next = options.onChange?.(x);
            if (next !== undefined) {
                store.label = next;
            }
        },
        commit: (instance: ContractFoundation, state: ContractState) => {
            rendered = state;
            log.push('commit');
            commitContexts.push(instance.getContext('theme'));
        },
        expose: (instance: ContractFoundation) => {
            foundation = instance;
        },
    };
    const view = render(ContractHarness, { props: { store, hooks } });
    return {
        log,
        commitContexts,
        foundation: () => foundation,
        renderedState: () => rendered,
        setLabel: async (next) => {
            store.label = next;
            flushSync();
        },
        setContext: async (next) => {
            store.theme = next;
            flushSync();
        },
        run: async (fn) => {
            fn(foundation);
            flushSync();
        },
        unmount: async () => view.unmount(),
    };
}

describe('Svelte useFoundation 宿主契约', () => {
    defineHostContract(mount, { strictMode: false, detachedOnDestroy: true });
});
