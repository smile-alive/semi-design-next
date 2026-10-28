/** @jsxImportSource vue */
import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Text, createCommentVNode, createTextVNode, nextTick } from 'vue';
import { fireEvent, render } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import * as components from '@fibrae/semi-ui-vue';
import slotNodes, { hasSlotContent } from '@fibrae/semi-ui-vue/_base/slot-nodes';
import semiGlobal, { semiGlobalKey } from '@fibrae/semi-ui-vue/_utils/semi-global';
import Controlled from './fixtures/controlled.vue';
import Defaults from './fixtures/defaults.vue';
import Dom from './fixtures/dom.vue';
import Host from './fixtures/host.vue';

afterEach(() => {
    semiGlobal.config = {};
});

describe('useControllable', () => {
    it('单向受控绑定只通知，父级同值重渲染不改变值', async () => {
        const view = render(Controlled, { props: { modelValue: 'controlled' } });
        await fireEvent.click(view.getByRole('button'));
        expect(view.getByRole('button')).toHaveTextContent('controlled');
        expect(view.emitted().change).toEqual([['next']]);
        expect(view.emitted()['update:modelValue']).toEqual([['next']]);
        await view.rerender({ modelValue: 'controlled', defaultValue: 'other' });
        expect(view.getByRole('button')).toHaveTextContent('controlled');
    });

    it('显式 undefined 为非受控，默认值只在初始化读取', async () => {
        const view = render(Controlled, { props: { modelValue: undefined } });
        expect(view.getByRole('button')).toHaveTextContent('initial');
        await fireEvent.click(view.getByRole('button'));
        await view.rerender({ defaultValue: 'changed' });
        expect(view.getByRole('button')).toHaveTextContent('next');
    });

    it('受控值回到 undefined 时可继续非受控更新', async () => {
        const view = render(Controlled, { props: { modelValue: 'first' } });
        await view.rerender({ modelValue: 'reset' });
        expect(view.getByRole('button')).toHaveTextContent('reset');
        await view.rerender({ modelValue: undefined });
        expect(view.getByRole('button')).toHaveTextContent('undefined');
        await fireEvent.click(view.getByRole('button'));
        expect(view.getByRole('button')).toHaveTextContent('next');
    });

    it('keepLastControlled 从最后受控值继续', async () => {
        const view = render(Controlled, { props: { modelValue: 'first', keepLastControlled: true } });
        await view.rerender({ modelValue: 'last' });
        await view.rerender({ modelValue: undefined });
        expect(view.getByRole('button')).toHaveTextContent('last');
        await fireEvent.click(view.getByRole('button'));
        expect(view.getByRole('button')).toHaveTextContent('next');
    });
});

describe('useFoundation', () => {
    it('覆盖层同步初始化与后续读取，提交回调先于后续 watcher 和 onUpdated', async () => {
        const view = render(Host, { props: { modelValue: 'mapped', identity: {} } });
        expect(view.getByRole('button', { name: 'mapped' })).toBeInTheDocument();
        expect(view.getByRole('status')).toHaveTextContent('same');
        expect(view.emitted().notify).toEqual([['init:mapped']]);
        await view.rerender({ modelValue: 'changed', suffix: 'suffix' });
        const start = view.emitted().notify.length;
        await fireEvent.click(view.getByRole('button', { name: 'mapped' }));
        expect(view.getByRole('button', { name: 'changed:suffix:1' })).toBeInTheDocument();
        expect(view.emitted().notify.slice(start)).toEqual([['sync:changed:suffix:1'], ['callback:changed:suffix:1'], ['watch'], ['updated']]);
        await fireEvent.click(view.getByRole('button', { name: '重复' }));
        expect(view.emitted().notify).toContainEqual(['repeat']);
    });

    it('挂载连接事件，卸载销毁并断开监听', async () => {
        const notify = vi.fn<(value: string) => void>();
        const view = render(Host, { props: { identity: {}, onNotify: notify } });
        document.dispatchEvent(new Event('fixture-event'));
        expect(notify).toHaveBeenLastCalledWith('event');
        view.unmount();
        expect(notify).toHaveBeenLastCalledWith('destroy');
        document.dispatchEvent(new Event('fixture-event'));
        await nextTick();
        expect(notify).toHaveBeenCalledTimes(3);
    });
});

describe('semiDefault', () => {
    it('实例值优先于 app 配置，app 配置优先于模块配置与组件默认值', () => {
        semiGlobal.config = { overrideDefaultProps: { Fixture: { label: 'module' } } };
        const view = render(Defaults, {
            props: { label: 'prop' },
            global: {
                provide: {
                    [semiGlobalKey as symbol]: {
                        config: { overrideDefaultProps: { Fixture: { label: 'app', disabled: true } } },
                    },
                },
            },
        });
        expect(view.getByRole('button')).toHaveTextContent('prop');
        expect(view.getByRole('button')).toBeDisabled();
    });

    it('函数默认值运行时读取，普通默认值按实例缓存', async () => {
        const filter = vi.fn<(value: string) => string>((value) => `global:${value}`);
        semiGlobal.config = { overrideDefaultProps: { Fixture: { label: 'global', filter } } };
        const view = render(Defaults);
        expect(view.getByRole('button')).toHaveTextContent('global');
        expect(view.getByRole('status')).toHaveTextContent('global:value');
        semiGlobal.config = { overrideDefaultProps: { Fixture: { label: 'changed' } } };
        await view.rerender({ label: 'explicit' });
        await view.rerender({ label: undefined });
        expect(view.getByRole('button')).toHaveTextContent('global');
        expect(filter).toHaveBeenCalledWith('value');
    });

    it('所有组件的 Boolean 有 default，Function 默认值为 undefined', () => {
        const violations: string[] = [];
        for (const component of [Defaults, Controlled, Host, Dom, ...Object.values(components)]) {
            if (!component || typeof component !== 'object' || !('props' in component)) {
                continue;
            }
            for (const option of Object.values(component.props as Record<string, { type?: unknown; default?: unknown } | null>)) {
                // `prop: null` is Vue's any-type declaration (withField's initValue), neither Boolean nor Function
                if (option === null) {
                    continue;
                }
                const types = [option.type].flat();
                if (types.includes(Boolean) && !Object.hasOwn(option, 'default')) {
                    violations.push('Boolean prop must declare default');
                }
                if (types.includes(Function) && option.default !== undefined) {
                    violations.push('Function prop must use undefined default');
                }
            }
        }
        expect(violations).toEqual([]);
    });
});

describe('DOM composable', () => {
    it('监听读取最新值，禁用与卸载后移除；watch 比较通过后读取提交的 DOM', async () => {
        const onEvent = vi.fn<(name: string) => void>();
        const view = render(Dom, { props: { onEvent } });
        const button = view.getByRole('button');
        await fireEvent.click(button);
        await view.rerender({ value: 'A' });
        expect(view.emitted().event).toEqual([['a']]);
        await view.rerender({ value: 'b' });
        expect(view.emitted().event).toContainEqual(['a:b:b']);
        await fireEvent.click(button);
        expect(view.emitted().event).toContainEqual(['b']);
        await fireEvent.mouseDown(button);
        expect(view.emitted().event).not.toContainEqual(['outside']);
        await fireEvent.mouseDown(document.body);
        expect(view.emitted().event).toContainEqual(['outside']);
        await view.rerender({ enabled: false });
        const count = view.emitted().event.length;
        await fireEvent.click(button);
        await fireEvent.mouseDown(document.body);
        expect(view.emitted().event).toHaveLength(count);
        view.unmount();
        await fireEvent.click(button);
        expect(onEvent).toHaveBeenCalledTimes(count);
    });

    it('attrs 变化后按落点更新，不缓存 useAttrs', async () => {
        const view = render(Dom, { attrs: { id: 'control', 'aria-label': 'before', 'data-root': 'root' } });
        expect(view.getByRole('button', { name: 'before' })).toHaveAttribute('id', 'control');
        expect(view.getByRole('button').parentElement).toHaveAttribute('data-root', 'root');
        await view.rerender({ 'aria-label': 'after' });
        expect(view.getByRole('button', { name: 'after' })).toBeInTheDocument();
    });

    it('ResizeObserver 卸载时断开', () => {
        const observe = vi.fn<(element: Element) => void>();
        const disconnect = vi.fn<() => void>();
        class Observer {
            observe = observe;
            disconnect = disconnect;
        }
        vi.stubGlobal('ResizeObserver', Observer);
        const view = render(Dom);
        expect(observe).toHaveBeenCalledWith(view.getByRole('button'));
        view.unmount();
        expect(disconnect).toHaveBeenCalledTimes(1);
    });
});

describe('slotNodes', () => {
    it('展开 Fragment、跳过注释，key 取自身 key 或含注释的位置，Fragment 加前缀', () => {
        const nodes = [
            <i key={1} />,
            createCommentVNode('v-if'),
            <>
                <b key={1} />
                <b key={2} />
            </>,
            <>
                <u key={1} />
            </>,
            createTextVNode('t'),
        ];
        expect(slotNodes(nodes).map(([node, key]) => [node.type, key])).toEqual([
            ['i', '$1'],
            ['b', '.2:$1'],
            ['b', '.2:$2'],
            ['u', '.3:$1'],
            [Text, '.4'],
        ]);
    });

    it('hasSlotContent：空文本、只含空白的文本与注释不算内容', () => {
        // `<template #icon>...</template>` then `{{ text }}` on its own line compiles to ' ' when text is empty
        expect(hasSlotContent(() => [createTextVNode(' '), createCommentVNode('v-if')])).toBe(false);
        expect(hasSlotContent(() => [createTextVNode('')])).toBe(false);
        expect(hasSlotContent(() => [createTextVNode(' a ')])).toBe(true);
        expect(hasSlotContent(() => [<i />])).toBe(true);
        expect(hasSlotContent()).toBe(false);
    });
});

describe('Vue JSX', () => {
    // Repo builds pick Vue from tsconfig, but the website's @vitejs/plugin-react sets a global React importSource that
    // only the per-file pragma overrides; no lint sees the runtime import the compiler injects
    it('每个 .tsx 首行声明 @jsxImportSource vue', () => {
        const root = path.resolve(import.meta.dirname, '../..');
        const files = globSync('**/*.tsx', { cwd: root });
        expect(files).not.toEqual([]);
        const missing = files.filter((file) => readFileSync(path.join(root, file), 'utf8').split('\n', 1)[0] !== '/** @jsxImportSource vue */');
        expect(missing).toEqual([]);
    });
});
