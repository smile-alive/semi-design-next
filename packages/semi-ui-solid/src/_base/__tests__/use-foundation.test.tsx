import { type Accessor, createEffect, createMemo, mergeProps, onMount } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vite-plus/test';
import BaseFoundation, { type DefaultAdapter } from '@fibrae/semi-foundation/base/foundation';
import useFoundation from '../use-foundation';

interface PairState {
    a: number;
    b: number;
    c?: number;
}

type PairAdapter = DefaultAdapter<object, PairState>;

class PairFoundation extends BaseFoundation<PairAdapter, object, PairState> {
    #bumps = 0;
    readonly label = 'pair';
    // an arrow field, like DragMove's handlePointerDown, which the component adds and removes by reference
    handleBump = () => this.bump();

    bump() {
        this.#bumps++;
        this.setState({ a: this.#bumps });
    }
}

const usePair = (createAdapter: (base: PairAdapter) => object = () => ({})) => useFoundation<PairFoundation, PairAdapter, object, PairState>(PairFoundation, {}, () => ({ a: 0, b: 0 }), createAdapter);

function mount(watch: (state: Accessor<Readonly<PairState>>) => void = () => {}) {
    let foundation!: PairFoundation;
    let adapter!: PairAdapter;
    let state!: Accessor<Readonly<PairState>>;
    const seen = { a: [] as number[], b: [] as number[], pair: [] as string[] };
    render(() => {
        const host = usePair((base) => {
            adapter = base;
            return {};
        });
        foundation = host.foundation;
        state = host.state;
        createEffect(() => seen.a.push(host.state().a));
        createEffect(() => seen.b.push(host.state().b));
        createEffect(() => seen.pair.push(`${host.state().a},${host.state().b}`));
        watch(host.state);
        return null;
    });
    return { foundation, adapter, state, seen };
}

describe('Solid useFoundation 按 key 订阅 state', () => {
    it('只读 a 的表达式在只写 b 时不重新执行', () => {
        const { foundation, seen } = mount();
        foundation.setState({ b: 1 });
        expect(seen.a).toEqual([0]);
        expect(seen.b).toEqual([0, 1]);
        foundation.setState({ a: 1 });
        expect(seen.a).toEqual([0, 1]);
        expect(seen.b).toEqual([0, 1]);
    });

    it('同值写入只通知读取该 key 的表达式', () => {
        const { foundation, seen } = mount();
        foundation.setState({ b: 0 });
        expect(seen.a).toEqual([0]);
        expect(seen.b).toEqual([0, 0]);
    });

    it('batch 外的一次 setState 写多个 key 只提交一次，各 key 一致', () => {
        // a foundation timer writes through the adapter directly, outside the batching proxy
        const { adapter, seen } = mount();
        adapter.setState({ a: 1, b: 1 });
        expect(seen.pair).toEqual(['0,0', '1,1']);
    });

    it('只调用 state() 不订阅任何 key', () => {
        let runs = 0;
        const { foundation } = mount((state) => {
            createEffect(() => {
                state();
                runs++;
            });
        });
        foundation.setState({ a: 1 });
        foundation.setState({ c: 1 });
        expect(runs).toBe(1);
    });

    it('读取初始 state 中没有的 key 也订阅，写入后重新执行', () => {
        // Modal reads onOKReturnPromiseStatus, which its initial state lacks
        const c: (number | undefined)[] = [];
        const { adapter } = mount((state) => {
            createEffect(() => c.push(state().c));
        });
        adapter.setState({ c: 1 });
        expect(c).toEqual([undefined, 1]);
    });

    it('与函数源一起 mergeProps 后仍随写入更新', () => {
        // Cascader's merge stays live only because the function source puts mergeProps in proxy mode
        const merged: number[] = [];
        const { foundation } = mount((state) => {
            const extra = createMemo(() => ({ b: 9 }));
            const view = mergeProps(state(), () => extra());
            createEffect(() => merged.push(view.a));
        });
        foundation.setState({ a: 1 });
        expect(merged).toEqual([0, 1]);
    });

    it('经视图赋值或定义属性抛 TypeError', () => {
        const { state } = mount();
        expect(() => Object.assign(state(), { a: 1 })).toThrow(TypeError);
        expect(() => Object.defineProperty(state(), 'a', { value: 1 })).toThrow(TypeError);
        expect(state().a).toBe(0);
    });
});

describe('Solid useFoundation 的 setState 回调', () => {
    it('父组件挂载时写入的回调在这次提交后执行', () => {
        let foundation!: PairFoundation;
        const calls: string[] = [];
        function Child() {
            foundation = usePair().foundation;
            return null;
        }
        render(() => {
            onMount(() => foundation.setState({ a: 1 }, () => calls.push('done')));
            return <Child />;
        });
        expect(calls).toEqual(['done']);
    });
});

describe('Solid useFoundation 返回的 foundation', () => {
    it('方法在实例本身上调用，能访问 # 私有字段', () => {
        const { foundation, seen } = mount();
        foundation.bump();
        foundation.bump();
        expect(seen.a).toEqual([0, 1, 2]);
    });

    it('同名处理函数每次读取都是同一个引用', () => {
        const { foundation, seen } = mount();
        const handle = foundation.handleBump;
        expect(foundation.handleBump).toBe(handle);
        handle();
        expect(seen.a).toEqual([0, 1]);
    });

    it('非函数字段原样读出', () => {
        const { foundation } = mount();
        expect(foundation.label).toBe('pair');
    });

    it('未传 context 时 getContext 与 getContexts 返回 undefined', () => {
        const { adapter } = mount();
        expect(adapter.getContexts()).toBeUndefined();
        expect(adapter.getContext('missing' as never)).toBeUndefined();
    });
});
