import { expect, it } from 'vite-plus/test';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';

export interface ContractProps {
    label?: string;
}

export interface ContractState {
    x: number;
}

interface ContractContext {
    theme: string;
}

export interface ContractAdapter extends DefaultAdapter<ContractProps, ContractState, ContractContext> {
    log: (entry: string) => void;
    notifyChange: (x: number) => void;
}

/** Every host renders `state.x` in `[data-contract-state]` and `label` in `[data-contract-label]` */
export const stateText = () => document.querySelector('[data-contract-state]')?.textContent ?? null;
const labelText = () => document.querySelector('[data-contract-label]')?.textContent ?? null;

export class ContractFoundation extends BaseFoundation<ContractAdapter, ContractProps, ContractState> {
    readonly signals: AbortSignal[] = [];

    override init() {
        this.signals.push(this.signal);
        this.adapter.log(`init state=${stateText()}`);
    }

    override destroy() {
        this.adapter.log(`destroy attached=${stateText() !== null} aborted=${this.signal.aborted}`);
    }

    /** An event handler that updates state first, then notifies the consumer */
    increment() {
        const x = this.getState('x') + 1;
        this.setState({ x }, () => this.adapter.log(`callback state=${stateText()} label=${this.getProp('label')}`));
        this.adapter.notifyChange(x);
    }

    /** Called by the host's native prop-change reaction (React and Vue `useDidUpdate`) */
    handleLabelChange() {
        this.adapter.log(`labelChange prop=${this.getProp('label')} dom=${labelText()}`);
    }
}

export interface ContractMountOptions {
    strictMode?: boolean;
    /** The initial `theme` context value; defaults to 'a' */
    context?: string;
    /** The consumer's change handler; a returned string becomes the next controlled `label` */
    onChange?: (x: number) => string | undefined;
}

/**
 * What a framework driver provides. It mounts a component that renders the two `data-contract-*` elements with
 * `label` starting at 'a', reacts to `label` changes with `handleLabelChange`, and logs 'commit' from a post-commit
 * hook declared after the host (React useLayoutEffect, Vue onMounted and onUpdated). That hook also appends
 * `foundation.getContext('theme')` to `commitContexts`. The host passes `{ theme }` as the foundation's context, where
 * `theme` follows `setContext`.
 */
export interface ContractHost {
    readonly log: string[];
    /** The `theme` context the foundation read in each post-commit hook */
    readonly commitContexts: string[];
    /** The instance the host keeps (StrictMode discards one) */
    foundation(): ContractFoundation;
    /** The state the last render read */
    renderedState(): ContractState;
    setLabel(label: string): Promise<void>;
    setContext(theme: string): Promise<void>;
    /** Runs `fn` as one event-handler batch, then flushes the framework's updates */
    run(fn: (foundation: ContractFoundation) => void): Promise<void>;
    unmount(): Promise<void>;
}

const lifecycle = (log: string[]) => log.filter((entry) => entry.startsWith('init') || entry.startsWith('destroy'));

/**
 * Registers the host contract documented on `BaseFoundation` (`semi-foundation/base/foundation.ts`) against one
 * framework host. A new host passes these cases before any component is ported to it. `detachedOnDestroy` marks a
 * host whose framework removes the DOM before it runs teardown (Svelte), so `destroy()` sees the DOM detached.
 */
export function defineHostContract(mount: (options?: ContractMountOptions) => Promise<ContractHost>, features: { strictMode: boolean; detachedOnDestroy?: boolean }) {
    it(`挂载后 init 一次、卸载时 destroy 一次；destroy 时 DOM ${features.detachedOnDestroy ? '已移除' : '仍挂载'}、signal 未 abort，卸载后 abort`, async () => {
        const host = await mount();
        expect(lifecycle(host.log)).toEqual(['init state=0']);
        const foundation = host.foundation();
        expect(foundation.signals.map((signal) => signal.aborted)).toEqual([false]);
        await host.unmount();
        expect(lifecycle(host.log)).toEqual(['init state=0', `destroy attached=${!features.detachedOnDestroy} aborted=false`]);
        expect(foundation.signals.map((signal) => signal.aborted)).toEqual([true]);
    });

    it.runIf(features.strictMode)('StrictMode 下 init 与 destroy 成对：挂载期间 init 比 destroy 多一次，卸载后相等且 signal 全部 abort', async () => {
        const host = await mount({ strictMode: true });
        const balance = () => lifecycle(host.log).filter((entry) => entry.startsWith('init')).length - lifecycle(host.log).filter((entry) => entry.startsWith('destroy')).length;
        expect(balance()).toBe(1);
        const foundation = host.foundation();
        expect(foundation.signals.at(-1)?.aborted).toBe(false);
        await host.unmount();
        expect(balance()).toBe(0);
        expect(foundation.signals.every((signal) => signal.aborted)).toBe(true);
    });

    it('setState 后同步读到新值，此时 DOM 尚未更新；提交后渲染的 state 与 getStates 内容相等', async () => {
        const host = await mount();
        await host.run((foundation) => {
            foundation.setState({ x: 1 });
            host.log.push(`read x=${foundation.getState('x')} dom=${stateText()}`);
        });
        expect(host.log).toContain('read x=1 dom=0');
        expect(stateText()).toBe('1');
        // object identity is a host detail: React renders a copy, Vue renders the object getStates returns
        expect(host.renderedState()).toEqual(host.foundation().getStates());
    });

    it('setState 回调在 DOM 显示新 state 之后、组件随后声明的提交钩子之前执行', async () => {
        const host = await mount();
        const start = host.log.length;
        await host.run((foundation) => foundation.setState({ x: 5 }, () => host.log.push(`callback state=${stateText()}`)));
        expect(host.log.slice(start)).toEqual(['callback state=5', 'commit']);
    });

    it('同值 setState 也会重新提交', async () => {
        const host = await mount();
        const commits = () => host.log.filter((entry) => entry === 'commit').length;
        const before = commits();
        await host.run((foundation) => foundation.setState({ x: 0 }));
        expect(commits()).toBe(before + 1);
    });

    it('同一批次内连续多次同步 setState 只提交一次，最终显示最后的值', async () => {
        const host = await mount();
        const commits = () => host.log.filter((entry) => entry === 'commit').length;
        const before = commits();
        await host.run((foundation) => {
            foundation.setState({ x: 1 });
            foundation.setState({ x: 2 });
            foundation.setState({ x: 3 });
        });
        expect(commits()).toBe(before + 1);
        expect(stateText()).toBe('3');
    });

    it('提交钩子中 getContext 读到本次渲染的最新 context', async () => {
        const host = await mount({ context: 'a' });
        expect(host.commitContexts).toEqual(['a']);
        await host.setContext('b');
        expect(host.commitContexts).toEqual(['a', 'b']);
    });

    it('props 变化的反应通过 getProp 读到新值且 DOM 已更新，挂载时不触发', async () => {
        const host = await mount();
        const reactions = () => host.log.filter((entry) => entry.startsWith('labelChange'));
        expect(reactions()).toEqual([]);
        await host.setLabel('b');
        expect(reactions()).toEqual(['labelChange prop=b dom=b']);
    });

    it('先 setState 再通知：使用方读到新 state 与旧 DOM，回调读到父级回写的受控 prop', async () => {
        const host = await mount({
            onChange: (x) => {
                const foundation = host.foundation();
                host.log.push(`onChange arg=${x} state=${foundation.getState('x')} dom=${stateText()} label=${foundation.getProp('label')}`);
                return `L${x}`;
            },
        });
        await host.run((foundation) => foundation.increment());
        expect(host.log.filter((entry) => /^(onChange|callback|labelChange)/.test(entry))).toEqual(['onChange arg=1 state=1 dom=0 label=a', 'callback state=1 label=L1', 'labelChange prop=L1 dom=L1']);
    });
}
