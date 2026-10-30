import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import { createStore } from '../../_base/__tests__/store.svelte';
import TransferCase from './transfer-case.svelte';

const items = [
    { label: 'apple', value: 'a', key: 'a' },
    { label: 'banana', value: 'b', key: 'b' },
];

describe('Svelte Transfer 服务端首帧', () => {
    it('首帧带两侧列表、已选项、搜索容器、分组角色与语言包名称', () => {
        const store = createStore({ props: { value: ['a'], dataSource: items, 'aria-label': 'Pick', 'data-x': '1' } });
        const { body } = render(TransferCase, { props: { store } });
        expect(body).toContain('semi-transfer-left');
        expect(body).toContain('semi-transfer-right');
        expect(body).toMatch(/<search[^>]*aria-label="筛选选项"/);
        expect(body).toMatch(/role="list"[^>]*>/);
        expect(body).toContain('banana');
        expect(body).toContain('semi-checkbox-checked');
        expect(body).toMatch(/<div[^>]*data-x="1"/);
        expect(body).toMatch(/<div[^>]*role="group"/);
        expect(body).toContain('总个数：2');
        expect(body).toContain('已选个数：1');
    });

    it('首帧的分组标题与嵌套列表用 $props.id 关联', () => {
        const store = createStore({
            props: {
                type: 'groupList' as const,
                dataSource: [
                    { title: 'G1', children: [{ label: 'a', value: 'a', key: 'a' }] },
                    { title: 'G2', children: [{ label: 'b', value: 'b', key: 'b' }] },
                ],
            },
        });
        const { body } = render(TransferCase, { props: { store } });
        const titleIds = [...body.matchAll(/<div [^>]*class="semi-transfer-group-title"[^>]*>/g)].map((match) => /id="([^"]+)"/.exec(match[0])?.[1]);
        expect(titleIds).toHaveLength(2);
        for (const id of titleIds) {
            expect(body).toContain(`aria-labelledby="${id}"`);
        }
    });

    it('draggable 的首帧是不可用的替身句柄，不含拖拽列表', () => {
        const store = createStore({ props: { value: ['a'], dataSource: items, draggable: true } });
        const { body } = render(TransferCase, { props: { store } });
        expect(body).toContain('aria-disabled="true"');
        expect(body).toContain('semi-transfer-right-item-draggable');
        expect(body).not.toContain('sortable-item');
    });

    it('空状态与 loading', () => {
        const empty = render(TransferCase, { props: { store: createStore({ props: { dataSource: [] } }) } });
        expect(empty.body).toContain('暂无数据');
        expect(empty.body).toContain('暂无内容，可从左侧勾选');
        const loading = render(TransferCase, { props: { store: createStore({ props: { dataSource: items, loading: true } }) } });
        expect(loading.body).toContain('semi-spin');
        expect(loading.body).not.toContain('semi-transfer-header-total">总个数');
    });

    it('treeList 的首帧带树与按路径显示的已选项', () => {
        const store = createStore({
            props: {
                type: 'treeList' as const,
                value: ['Osaka'],
                showPath: true,
                dataSource: [{ label: 'Asia', value: 'Asia', key: '0', children: [{ label: 'Osaka', value: 'Osaka', key: '0-0' }] }],
            },
        });
        const { body } = render(TransferCase, { props: { store } });
        expect(body).toContain('role="tree"');
        expect(body).toContain('Asia > Osaka');
    });

    it('自定义面板与 snippet 在首帧输出', () => {
        const store = createStore({ props: { dataSource: items }, sourcePanel: 'plain' as const, selectedItem: 'text' as const, emptyRight: 'text' as const });
        const { body } = render(TransferCase, { props: { store } });
        expect(body).toContain('Source');
        expect(body).toContain('No selection');
        expect(body).not.toContain('semi-transfer-left');
    });
});
