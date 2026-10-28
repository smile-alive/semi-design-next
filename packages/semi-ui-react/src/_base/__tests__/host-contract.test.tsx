import { Activity, StrictMode, useLayoutEffect, useState } from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';
import { type ContractHost, type ContractMountOptions, type ContractProps, type ContractState, ContractFoundation, defineHostContract, stateText } from '@test/utils/host-contract';
import useDidUpdate from '../use-did-update';
import useFoundation from '../use-foundation';

async function mount(options: ContractMountOptions & { wrapInActivity?: boolean } = {}): Promise<ContractHost & { setVisible: (visible: boolean) => Promise<void> }> {
    const log: string[] = [];
    const commitContexts: string[] = [];
    let foundation: ContractFoundation;
    let rendered: ContractState;
    let setLabel: (label: string) => void;
    let setTheme: (theme: string) => void;
    let setVisible: (visible: boolean) => void;

    function Probe({ theme, ...props }: ContractProps & { theme: string }) {
        const [f, state] = useFoundation(
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
            { theme }
        );
        useDidUpdate(props.label, () => f.handleLabelChange());
        useLayoutEffect(() => {
            foundation = f;
            rendered = state;
            log.push('commit');
            commitContexts.push(f.getContext('theme'));
        });
        return (
            <>
                <span data-contract-state>{state.x}</span>
                <span data-contract-label>{props.label}</span>
            </>
        );
    }

    function Parent() {
        const [label, changeLabel] = useState('a');
        const [theme, changeTheme] = useState(options.context ?? 'a');
        const [visible, changeVisible] = useState(true);
        useLayoutEffect(() => {
            setLabel = changeLabel;
            setTheme = changeTheme;
            setVisible = changeVisible;
        }, []);
        const probe = <Probe label={label} theme={theme} />;
        return options.wrapInActivity ? <Activity mode={visible ? 'visible' : 'hidden'}>{probe}</Activity> : probe;
    }

    const view = render(
        options.strictMode ? (
            <StrictMode>
                <Parent />
            </StrictMode>
        ) : (
            <Parent />
        )
    );
    return {
        log,
        commitContexts,
        foundation: () => foundation,
        renderedState: () => rendered,
        setLabel: async (label) => act(() => setLabel(label)),
        setContext: async (theme) => act(() => setTheme(theme)),
        setVisible: async (visible) => act(() => setVisible(visible)),
        run: async (fn) => act(() => fn(foundation)),
        unmount: async () => view.unmount(),
    };
}

describe('React useFoundation 宿主契约', () => {
    defineHostContract(mount, { strictMode: true });

    // Activity runs effect cleanups on hide and effects again on show, so a hidden component holds no listeners;
    // that is why `init` must be idempotent
    it('Activity 隐藏时 destroy 并 abort signal，再次显示时在保留的 state 上重新 init', async () => {
        const host = await mount({ wrapInActivity: true });
        await host.run((foundation) => foundation.setState({ x: 2 }));
        const foundation = host.foundation();
        await host.setVisible(false);
        expect(host.log.filter((entry) => /^(init|destroy)/.test(entry))).toEqual(['init state=0', 'destroy attached=true aborted=false']);
        expect(foundation.signals.map((signal) => signal.aborted)).toEqual([true]);
        await host.setVisible(true);
        expect(host.log.filter((entry) => /^(init|destroy)/.test(entry))).toEqual(['init state=0', 'destroy attached=true aborted=false', 'init state=2']);
        expect(foundation.signals.map((signal) => signal.aborted)).toEqual([true, false]);
        expect(stateText()).toBe('2');
    });
});
