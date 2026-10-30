import { flushSync } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { createStore } from '../../_base/__tests__/store.svelte';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import type { DescriptionsData, DescriptionsProps } from '../interface';
import DescriptionsStore from './descriptions-store.svelte';

const prefixCls = `${BASE_CLASS_PREFIX}-descriptions`;

const data: DescriptionsData[] = [
    { key: '实际用户数量', value: '1,480,000' },
    { key: '7天留存', value: '98%' },
    { key: '安全等级', value: '3级' },
    { key: '垂类标签', value: '电商' },
    { key: '认证状态', value: '未认证' },
];
const dataWithHide: DescriptionsData[] = [{ ...data[0], hidden: true }, ...data.slice(1)];

function setup(props: DescriptionsProps = {}, options: { snippets?: boolean; context?: Map<unknown, unknown> } = {}) {
    const store = createStore<DescriptionsProps>({ data, ...props });
    const view = render(DescriptionsStore, { props: { store, snippets: options.snippets }, ...(options.context ? { context: options.context } : {}) });
    return { store, container: view.container, unmount: view.unmount };
}

const getKeys = (container: Element) => container.querySelectorAll(`.${prefixCls}-key`);
const getValues = (container: Element) => container.querySelectorAll(`.${prefixCls}-value`);
const colspans = (container: Element) => [...container.querySelectorAll('td')].map((td) => td.getAttribute('colspan'));

describe('Svelte Descriptions', () => {
    it('使用 data 渲染', () => {
        const { container } = setup();
        expect(container.querySelectorAll('tr')).toHaveLength(5);
        expect(getKeys(container)[0]).toHaveTextContent(/^实际用户数量$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1,480,000$/);
    });

    it('设置 class 与 style，并透传 id、aria-label、data-*', () => {
        const { container } = setup({ class: 'test', style: 'height: 420px', id: 'desc', 'aria-label': 'stats', 'data-testid': 'd' });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveClass('test');
        expect(root).toHaveStyle({ height: '420px' });
        expect(root).toHaveAttribute('id', 'desc');
        expect(root).toHaveAttribute('aria-label', 'stats');
        expect(root).toHaveAttribute('data-testid', 'd');
    });

    it('设置 align 对齐', () => {
        for (const align of ['center', 'justify', 'left', 'plain'] as const) {
            const view = setup({ align });
            expect(view.container.querySelector(`.${prefixCls}-${align}`)).not.toBeNull();
            view.unmount();
        }
    });

    it('设置 row 与 size', () => {
        const { container } = setup({ row: true });
        expect(container.querySelector(`.${prefixCls}-double`)).not.toBeNull();
        for (const size of ['small', 'medium', 'large'] as const) {
            const view = setup({ row: true, size });
            expect(view.container.querySelector(`.${prefixCls}-double-${size}`)).not.toBeNull();
            view.unmount();
        }
    });

    it('dataItem 隐藏', () => {
        const { container } = setup({ data: dataWithHide });
        expect(container.querySelectorAll('tr')).toHaveLength(4);
        expect(getKeys(container)[0]).toHaveTextContent(/^7天留存$/);
        expect(container).not.toHaveTextContent('实际用户数量');
    });

    it('不把 value 等数据项字段放到行上', () => {
        const { container } = setup({ data: [{ key: 'a', value: '1', span: 2, keyStyle: 'color: red' }] });
        for (const tr of container.querySelectorAll('tr')) {
            expect(tr.getAttributeNames()).toEqual([]);
        }
    });

    it('align 非 plain 时渲染 th 与 td，colspan 为 span * 2 - 1', () => {
        const { container } = setup({
            data: [
                { key: 'a', value: '1', span: 2 },
                { key: 'b', value: '2' },
            ],
        });
        const rows = container.querySelectorAll('tr');
        expect(rows[0].querySelectorAll('th')).toHaveLength(1);
        expect(rows[0].querySelector('td')).toHaveAttribute('colspan', '3');
        expect(rows[1].querySelector('td')).toHaveAttribute('colspan', '1');
        expect(rows[0].querySelector('th')).toHaveClass(`${prefixCls}-item-th`);
        expect(rows[0].querySelector('td')).toHaveClass(`${prefixCls}-item-td`);
    });

    it('align 为 plain 时渲染单个 td，colspan 为 span，并带结尾冒号', () => {
        const { container } = setup({
            align: 'plain',
            data: [
                { key: 'a', value: '1', span: 2 },
                { key: 'b', value: '2' },
            ],
        });
        const rows = container.querySelectorAll('tr');
        expect(container.querySelectorAll('th')).toHaveLength(0);
        expect(rows[0].querySelectorAll('td')).toHaveLength(1);
        expect(rows[0].querySelector('td')).toHaveAttribute('colspan', '2');
        expect(rows[1].querySelector('td')).toHaveAttribute('colspan', '1');
        expect(getKeys(container)[0]).toHaveTextContent(/^a:$/);
    });

    it('keyStyle 作用于 key', () => {
        const { container } = setup({ data: [{ key: 'a', value: 'raw', keyStyle: 'color: red' }] });
        expect(getKeys(container)[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('水平布局按 column 分行，跳过隐藏项，并拉伸最后一项', () => {
        const { container } = setup({ layout: 'horizontal', data: dataWithHide, column: 3 });
        const rows = container.querySelectorAll('tr');
        expect(container.querySelector(`.${prefixCls}-horizontal`)).not.toBeNull();
        expect(rows).toHaveLength(2);
        expect(rows[0].querySelectorAll('th')).toHaveLength(3);
        expect(rows[1].querySelectorAll('th')).toHaveLength(1);
        expect(rows[1].querySelector('td')).toHaveAttribute('colspan', '5');
        expect(container).not.toHaveTextContent('实际用户数量');
    });

    it('水平 plain 布局中 span 作为 td 的 colspan', () => {
        const { container } = setup({
            layout: 'horizontal',
            align: 'plain',
            column: 3,
            data: [
                { key: 'a', value: '1', span: 2 },
                { key: 'b', value: '2' },
            ],
        });
        expect(container.querySelectorAll('th')).toHaveLength(0);
        expect(colspans(container)).toEqual(['2', '1']);
        expect(getKeys(container)[1]).toHaveTextContent(/^b:$/);
    });

    it('不修改调用方的 data，之后修改 column 会重新布局', () => {
        const items = data.slice(0, 4).map((entry) => ({ ...entry }));
        const { store, container } = setup({ column: 3, data: items, layout: 'horizontal' });
        expect(items[3].span).toBeUndefined();
        store.column = 4;
        flushSync();
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect([...container.querySelectorAll('td')].at(-1)).toHaveAttribute('colspan', '1');
    });

    it('data 变化时更新', () => {
        const { store, container } = setup();
        store.data = [{ key: 'only', value: 'one' }];
        flushSync();
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(getKeys(container)[0]).toHaveTextContent(/^only$/);
    });

    it('key、value 为 number 时无 snippet 直接渲染', () => {
        const { container } = setup({ data: [{ key: 1, value: 0 }] });
        expect(getKeys(container)[0]).toHaveTextContent(/^1$/);
        expect(getValues(container)[0]).toHaveTextContent(/^0$/);
    });

    describe('snippet', () => {
        const slotData: DescriptionsData[] = [
            { key: 'first', value: 1 },
            { key: 'hidden', value: 'h', hidden: true },
            { key: 'tag', value: 'shop' },
            { key: 'last', value: 'end' },
        ];

        it('纵向 data 的 itemKey、value 收到 { item, index }，index 计入隐藏项', () => {
            const { container } = setup({ data: slotData }, { snippets: true });
            expect(container.querySelector(`.${prefixCls}-key .rich-key`)).toHaveTextContent(/^1:first$/);
            expect(getValues(container)[0]).toHaveTextContent(/^1@0$/);
            expect(getKeys(container)[2]).toHaveTextContent(/^4:last$/);
            expect(container).not.toHaveTextContent('hidden');
        });

        it('横向 data 的 snippet 同样收到原下标，被拉伸的最后一项保留其 index', () => {
            const { container } = setup({ data: slotData, layout: 'horizontal', column: 2 }, { snippets: true });
            const rows = container.querySelectorAll('tr');
            expect(rows).toHaveLength(2);
            expect(getKeys(container)[2]).toHaveTextContent(/^4:last$/);
            expect(getValues(container)[2]).toHaveTextContent(/^end@3$/);
            expect(rows[1].querySelector('td')).toHaveAttribute('colspan', '3');
        });
    });

    it('读取全局默认值，显式属性优先', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = { Descriptions: { align: 'plain', layout: 'horizontal' } };
        const { store, container } = setup({}, { context: new Map([[semiGlobalKey, semi]]) });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveClass(`${prefixCls}-plain`);
        expect(root).toHaveClass(`${prefixCls}-horizontal`);
        store.align = 'left';
        flushSync();
        expect(root).toHaveClass(`${prefixCls}-left`);
    });
});
