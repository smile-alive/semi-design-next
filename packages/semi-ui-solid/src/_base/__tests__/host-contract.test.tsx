import { batch, createEffect, createSignal, on } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import { type ContractAdapter, type ContractHost, type ContractMountOptions, type ContractProps, type ContractState, ContractFoundation, defineHostContract, stateText } from '@test/utils/host-contract';
import useFoundation from '../use-foundation';

async function mount(options: ContractMountOptions = {}): Promise<ContractHost> {
    const log: string[] = [];
    const commitContexts: string[] = [];
    let foundation: ContractFoundation;
    let rendered: ContractState;
    const [label, setLabel] = createSignal('a');
    const [theme, setTheme] = createSignal(options.context ?? 'a');

    function Probe(props: ContractProps & { theme: string }) {
        const host = useFoundation<ContractFoundation, ContractAdapter, ContractProps, ContractState>(
            ContractFoundation,
            props,
            () => ({ x: 0 }),
            () => ({
                log: (entry: string) => {
                    log.push(entry);
                },
                notifyChange: (x: number) => {
                    const next = options.onChange?.(x);
                    if (next !== undefined) {
                        setLabel(next);
                    }
                },
            }),
            { context: () => ({ theme: props.theme }) }
        );
        foundation = host.foundation;
        createEffect(
            on(
                () => props.label,
                () => host.foundation.handleLabelChange(),
                { defer: true }
            )
        );
        // Solid has no component re-render: the commit hook is an effect that reads every state key it shows
        createEffect(() => {
            rendered = { x: host.state().x };
            log.push('commit');
            commitContexts.push(host.foundation.getContext('theme'));
        });
        return (
            <>
                <span data-contract-state>{host.state().x}</span>
                <span data-contract-label>{props.label}</span>
                <button type="button" onClick={() => host.foundation.increment()}>
                    increment
                </button>
            </>
        );
    }

    const view = render(() => <Probe label={label()} theme={theme()} />);
    return {
        log,
        commitContexts,
        foundation: () => foundation,
        renderedState: () => rendered,
        setLabel: async (next) => {
            setLabel(next);
        },
        setContext: async (next) => {
            setTheme(next);
        },
        // The foundation batches each method call; one handler that calls several of them needs its own batch
        run: async (fn) => batch(() => fn(foundation)),
        unmount: async () => view.unmount(),
    };
}

describe('Solid useFoundation 宿主契约', () => {
    defineHostContract(mount, { strictMode: false });

    it('委托事件中调用 foundation 方法：使用方读到新 state 与旧 DOM，回调在提交之后', async () => {
        const host = await mount({
            onChange: (x) => {
                host.log.push(`onChange arg=${x} state=${host.foundation().getState('x')} dom=${stateText()}`);
                return `L${x}`;
            },
        });
        screen.getByRole('button').click();
        expect(host.log.filter((entry) => /^(onChange|callback|labelChange)/.test(entry))).toEqual(['onChange arg=1 state=1 dom=0', 'callback state=1 label=L1', 'labelChange prop=L1 dom=L1']);
    });

    // The server build's mergeProps copies descriptors, so a view that lists no keys merges into an empty object
    it('state 视图可展开、列出键与 in 判断，只含 state 自身的键', () => {
        let state!: () => Readonly<ContractState>;
        let foundation!: ContractFoundation;
        function Probe(props: ContractProps) {
            const host = useFoundation<ContractFoundation, ContractAdapter, ContractProps, ContractState>(
                ContractFoundation,
                props,
                () => ({ x: 0 }),
                () => ({ log: () => undefined, notifyChange: () => undefined })
            );
            state = host.state;
            foundation = host.foundation;
            return null;
        }
        render(() => <Probe label="a" />);
        expect(Object.keys(state())).toEqual(['x']);
        expect('x' in state()).toBe(true);
        expect('constructor' in state()).toBe(false);
        foundation.increment();
        expect({ ...state() }).toEqual({ x: 1 });
    });
});
