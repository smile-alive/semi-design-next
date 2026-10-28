/** @jsxImportSource vue */
import { type VNode } from 'vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { render } from '@test/utils/vue';
import { SemiGlobal, semiGlobalKey } from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';
import Descriptions, { DescriptionsItem, type DescriptionsData, type DescriptionsItemProps, type DescriptionsProps } from '../index';
import Authored from './fixtures/authored.vue';
import DataSlots from './fixtures/data-slots.vue';
import Instance from './fixtures/instance.vue';

const prefixCls = `${BASE_CLASS_PREFIX}-descriptions`;

const data: DescriptionsData[] = [
    { key: '实际用户数量', value: '1,480,000' },
    { key: '7天留存', value: '98%' },
    { key: '安全等级', value: '3级' },
    { key: '垂类标签', value: '电商' },
    { key: '认证状态', value: '未认证' },
];
const dataWithHide: DescriptionsData[] = [{ ...data[0], hidden: true }, ...data.slice(1)];

type Attrs = Record<string, unknown>;
const renderDescriptions = (props: DescriptionsProps = {}, attrs: Attrs = {}) => render(Descriptions, { props: { data, ...props }, attrs });
const item = (props: DescriptionsItemProps & Attrs, key: string | (() => VNode), value: string): VNode => <DescriptionsItem {...props}>{{ itemKey: typeof key === 'string' ? () => key : key, default: () => value }}</DescriptionsItem>;
const renderItems = (children: () => Array<VNode | string>, props: DescriptionsProps = {}, attrs: Attrs = {}) => render(Descriptions, { props, attrs, slots: { default: children } });

const getKeys = (container: Element) => container.querySelectorAll(`.${prefixCls}-key`);
const getValues = (container: Element) => container.querySelectorAll(`.${prefixCls}-value`);
const colspans = (container: Element) => [...container.querySelectorAll('td')].map((td) => td.getAttribute('colspan'));

describe('Descriptions', () => {
    it('使用 data 渲染', () => {
        const { container } = renderDescriptions();
        expect(container.querySelectorAll('tr')).toHaveLength(5);
        expect(getKeys(container)[0]).toHaveTextContent(/^实际用户数量$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1,480,000$/);
    });

    it('Descriptions.Item 脱离 Descriptions 单独渲染时不抛错并输出一行', () => {
        const { container } = render(() => (
            <table>
                <tbody>{item({}, 'k', 'v')}</tbody>
            </table>
        ));
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(container.querySelectorAll('th')).toHaveLength(1);
        expect(getKeys(container)[0]).toHaveTextContent(/^k$/);
        expect(getValues(container)[0]).toHaveTextContent(/^v$/);
    });

    it('设置 class 与 style', () => {
        const { container } = renderDescriptions({}, { class: 'test', style: { height: '420px' } });
        const descriptions = container.querySelector(`.${prefixCls}`);
        expect(descriptions).toHaveClass('test');
        expect(descriptions).toHaveStyle({ height: '420px' });
    });

    it('设置 align 对齐', () => {
        for (const align of ['center', 'justify', 'left', 'plain'] as const) {
            const view = renderDescriptions({ align });
            expect(view.container.querySelector(`.${prefixCls}-${align}`)).not.toBeNull();
            view.unmount();
        }
    });

    it('设置 row', () => {
        const { container } = renderDescriptions({ row: true });
        expect(container.querySelector(`.${prefixCls}-double`)).not.toBeNull();
    });

    it('dataItem 隐藏', () => {
        const { container } = renderDescriptions({ data: dataWithHide });
        expect(container.querySelectorAll('tr')).toHaveLength(4);
        expect(getKeys(container)[0]).toHaveTextContent(/^7天留存$/);
        expect(getValues(container)[0]).toHaveTextContent(/^98%$/);
        expect(container).not.toHaveTextContent('实际用户数量');
    });

    it('设置 size', () => {
        for (const size of ['small', 'medium', 'large'] as const) {
            const view = renderDescriptions({ row: true, size });
            expect(view.container.querySelector(`.${prefixCls}-double-${size}`)).not.toBeNull();
            view.unmount();
        }
    });

    it('使用 Item 子节点', () => {
        const { container } = renderItems(() => data.map((entry) => item({}, String(entry.key), String(entry.value))));
        expect(container.querySelectorAll('tr')).toHaveLength(5);
        expect(getKeys(container)[0]).toHaveTextContent(/^实际用户数量$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1,480,000$/);
    });

    it('Item 的 #itemKey 放节点', () => {
        const { container } = renderItems(() => [item({}, () => <strong>实际用户数量</strong>, '1,480,000')]);
        expect(container.querySelector(`.${prefixCls}-key strong`)).toHaveTextContent(/^实际用户数量$/);
    });

    it('水平布局', () => {
        const { container } = renderItems(() => [item({}, () => <strong style={{ color: 'red' }}>实际用户数量</strong>, '1,480,000'), item({}, '7天留存', '98%'), item({}, '认证状态', '未认证')], { align: 'left', column: 4, layout: 'horizontal' });
        const tds = container.querySelectorAll('td');
        expect(tds).toHaveLength(3);
        const ths = container.querySelectorAll('th');
        expect(ths).toHaveLength(3);
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(container.querySelector(`.${prefixCls}-horizontal`)).not.toBeNull();
        expect(getKeys(container)[0]).toHaveTextContent(/^实际用户数量$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1,480,000$/);
        let totalSpan = ths.length;
        tds.forEach((td) => {
            totalSpan += Number(td.getAttribute('colspan'));
        });
        expect(totalSpan).toEqual(8);
    });

    it('data-* 透传到根 div 与条目行', () => {
        const { container } = renderItems(() => [item({ 'data-row': '1' }, 'a', '1')], {}, { 'data-testid': 'desc' });
        expect(container.querySelector(`.${prefixCls}`)).toHaveAttribute('data-testid', 'desc');
        expect(container.querySelector('tr')).toHaveAttribute('data-row', '1');
    });

    it('垂直布局下 class 与 style 作用于条目行', () => {
        const { container } = renderItems(() => [item({ class: 'row-a', style: { color: 'red' } }, 'a', '1')]);
        const tr = container.querySelector('tr');
        expect(tr).toHaveClass('row-a');
        expect(tr).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('不把 value 等数据项字段放到行上', () => {
        const { container } = renderDescriptions({
            data: [{ key: 'a', value: '1', span: 2, keyStyle: { color: 'red' } }],
        });
        for (const tr of container.querySelectorAll('tr')) {
            expect(tr.getAttributeNames()).toEqual([]);
        }
    });

    it('align 非 plain 时渲染 th 与 td，colspan 为 span * 2 - 1', () => {
        const { container } = renderDescriptions({
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
        const { container } = renderDescriptions({
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

    it('keyStyle 作用于 key，#value 插槽提供 value', () => {
        const { container } = render(Descriptions, {
            props: { data: [{ key: 'a', value: 'raw', keyStyle: { color: 'red' } }] },
            slots: { value: () => 'from slot' },
        });
        expect(getKeys(container)[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getValues(container)[0]).toHaveTextContent(/^from slot$/);

        const jsx = renderItems(() => [item({ keyStyle: { color: 'blue' } }, 'b', 'from children')]);
        expect(getKeys(jsx.container)[0]).toHaveStyle({ color: 'rgb(0, 0, 255)' });
        expect(getValues(jsx.container)[0]).toHaveTextContent(/^from children$/);
    });

    it('跳过以模板书写的隐藏项（hidden 简写）', () => {
        const view = render(Authored, { props: { extra: ['b'] } });
        expect(view.container.querySelectorAll('tr')).toHaveLength(2);
        expect(view.container).not.toHaveTextContent('hidden');
    });

    it('水平数据按 column 分行，跳过隐藏项，并拉伸最后一项', () => {
        const items = dataWithHide.map((entry) => ({ ...entry }));
        const { container } = renderDescriptions({ layout: 'horizontal', data: items, column: 3 });
        const rows = container.querySelectorAll('tr');
        expect(rows).toHaveLength(2);
        expect(rows[0].querySelectorAll('th')).toHaveLength(3);
        expect(rows[1].querySelectorAll('th')).toHaveLength(1);
        expect(rows[1].querySelector('td')).toHaveAttribute('colspan', '5');
        expect(container).not.toHaveTextContent('实际用户数量');
    });

    it('水平 plain 布局中 span 作为 td 的 colspan', () => {
        const { container } = renderDescriptions({
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

    it('非 Item 子节点不占列位，最后一个真实项填满整行', () => {
        const { container } = renderItems(() => ['text', '42', item({}, 'a', '1'), item({}, 'b', '2')], {
            column: 3,
            layout: 'horizontal',
        });
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(container.querySelectorAll('th')).toHaveLength(2);
        expect(colspans(container)).toEqual(['1', '3']);
    });

    it('RTL 下 align left 在 rtl 包裹层内保留 left 类名', () => {
        const { container } = render(() => <ConfigProvider direction="rtl">{() => <Descriptions align="left" data={data} />}</ConfigProvider>);
        expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-left`)).not.toBeNull();
    });

    it('不修改调用方的 data，之后修改 column 会重新布局', async () => {
        const items = data.slice(0, 4).map((entry) => ({ ...entry }));
        const view = render(Descriptions, { props: { column: 3, data: items, layout: 'horizontal' } });
        expect(items[3].span).toBeUndefined();
        await view.rerender({ column: 4, data: items, layout: 'horizontal' });
        expect(view.container.querySelectorAll('tr')).toHaveLength(1);
        expect([...view.container.querySelectorAll('td')].at(-1)).toHaveAttribute('colspan', '1');
    });

    it('读取注入的 semiGlobal overrideDefaultProps，Descriptions.Item 不读取', () => {
        const semi = new SemiGlobal();
        semi.config.overrideDefaultProps = {
            Descriptions: { align: 'plain', layout: 'horizontal' },
            DescriptionsItem: { hidden: true },
        } as SemiGlobal['config']['overrideDefaultProps'];
        const { container } = render(Descriptions, {
            props: { data },
            global: { provide: { [semiGlobalKey]: semi } },
        });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveClass(`${prefixCls}-plain`);
        expect(root).toHaveClass(`${prefixCls}-horizontal`);
        expect(getKeys(container)).toHaveLength(5);
    });

    it('组件 $el 指向根 div，Descriptions.Item 的 $el 指向其行', () => {
        const view = render(Instance);
        const [root, row] = view.emitted<[Element, Element]>().els[0];
        expect(root).toBe(view.container.querySelector(`.${prefixCls}`));
        expect(row).toBe(view.container.querySelector('tr'));
    });

    it('把 id、aria-label 等未声明属性透传到根 div', () => {
        const { container } = renderDescriptions({}, { id: 'desc', 'aria-label': 'stats' });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('id', 'desc');
        expect(root).toHaveAttribute('aria-label', 'stats');
    });
});

describe('Descriptions（Vue）', () => {
    const slotData: DescriptionsData[] = [
        { key: 'first', value: 1 },
        { key: 'hidden', value: 'h', hidden: true },
        { key: 'tag', value: 'shop' },
        { key: 'last', value: 'end' },
    ];

    it('纵向 data 的 #itemKey、#value 收到 { item, index }，index 计入隐藏项', () => {
        const { container } = render(DataSlots, { props: { data: slotData } });
        expect(container.querySelector(`.${prefixCls}-key .rich-key`)).toHaveTextContent(/^first$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1@0$/);
        expect(container.querySelector(`.${prefixCls}-value .rich-value`)).toHaveTextContent(/^shop$/);
        expect(getKeys(container)[2]).toHaveTextContent(/^3:last$/);
        expect(container).not.toHaveTextContent('hidden');
    });

    it('横向 data 的插槽同样收到原下标，被拉伸的最后一项保留其 index', () => {
        const { container } = render(DataSlots, { props: { data: slotData, layout: 'horizontal', column: 2 } });
        const rows = container.querySelectorAll('tr');
        expect(rows).toHaveLength(2);
        expect(getKeys(container)[2]).toHaveTextContent(/^3:last$/);
        expect(getValues(container)[2]).toHaveTextContent(/^end@3$/);
        expect(rows[1].querySelector('td')).toHaveAttribute('colspan', '3');
        const stretched = render(DataSlots, { props: { data: slotData.slice(0, 3), layout: 'horizontal', column: 3 } });
        expect(getValues(stretched.container)[1]).toHaveTextContent(/^shop$/);
        expect(colspans(stretched.container)).toEqual(['1', '3']);
    });

    it('data 的 key、value 为 string 或 number 时无插槽直接渲染', () => {
        const { container } = render(Descriptions, { props: { data: [{ key: 1, value: 0 }] } });
        expect(getKeys(container)[0]).toHaveTextContent(/^1$/);
        expect(getValues(container)[0]).toHaveTextContent(/^0$/);
    });

    it('横向布局读取模板写法的 Item：hidden 简写跳过，span 字符串规整为数字，v-for 的 Item 参与分行', () => {
        const view = render(Authored, { props: { layout: 'horizontal', column: 3, extra: ['b', 'c'] } });
        const rows = view.container.querySelectorAll('tr');
        expect(rows).toHaveLength(2);
        expect(view.container).not.toHaveTextContent('hidden');
        expect(view.container.querySelector('.not-an-item')).toBeNull();
        expect(colspans(view.container)).toEqual(['3', '1', '5']);
        const stringSpan = renderItems(
            () => [
                // the cast stands for `span="2"` written in a template without a colon
                item({ span: '2' } as unknown as DescriptionsItemProps & Attrs, 'a', '1'),
                item({}, 'b', '2'),
                item({}, 'c', '3'),
            ],
            { layout: 'horizontal', column: 3 }
        );
        expect(stringSpan.container.querySelectorAll('tr')).toHaveLength(2);
        expect(colspans(stringSpan.container)).toEqual(['3', '1', '5']);
    });

    it('非 Item 子节点在纵向布局原样渲染', () => {
        const view = render(Authored, { props: { extra: [] } });
        expect(view.container.querySelector('.not-an-item')).toHaveTextContent('other');
        expect(view.container).toHaveTextContent('text');
    });

    it('横向布局的 Item 不产生 attrs 警告，纵向时 attrs 落在 tr', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const horizontal = renderItems(() => [item({ class: 'row', 'data-x': '1' }, 'a', '1')], {
            layout: 'horizontal',
        });
        expect(horizontal.container.querySelector('.row')).toBeNull();
        expect(horizontal.container.querySelector('[data-x]')).toBeNull();
        expect(warn).not.toHaveBeenCalled();
        const vertical = renderItems(() => [item({ class: 'row', 'data-x': '1' }, 'a', '1')]);
        expect(vertical.container.querySelector('tr')).toHaveClass('row');
        expect(vertical.container.querySelector('tr')).toHaveAttribute('data-x', '1');
    });

    it('Descriptions.Item 与具名导出 DescriptionsItem 是同一个对象', () => {
        expect(Descriptions.Item).toBe(DescriptionsItem);
    });

    it('Boolean prop 都有 default 键，Function prop 的 default 为 undefined', () => {
        const offenders = [Descriptions, DescriptionsItem].flatMap((component) =>
            Object.entries((component as unknown as { props: Record<string, { type?: unknown; default?: unknown }> }).props)
                .filter(([, option]) => {
                    const types = [option.type].flat();
                    return (types.includes(Boolean) && !Object.hasOwn(option, 'default')) || (types.includes(Function) && option.default !== undefined);
                })
                .map(([name]) => name)
        );
        expect(offenders).toEqual([]);
    });
});
