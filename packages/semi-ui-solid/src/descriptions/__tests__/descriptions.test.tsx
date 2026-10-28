import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Descriptions, { type Data, type DescriptionsProps } from '..';
import semiGlobal from '../../_utils/semi-global';
import ConfigProvider from '../../config-provider';

const prefixCls = `${BASE_CLASS_PREFIX}-descriptions`;

const data: Data[] = [
    { key: '实际用户数量', value: '1,480,000' },
    { key: '7天留存', value: '98%' },
    { key: '安全等级', value: '3级' },
    { key: '垂类标签', value: '电商' },
    { key: '认证状态', value: '未认证' },
];

const dataWithHide: Data[] = data.map((item, index) => (index === 0 ? { ...item, hidden: true } : item));

// extra keys stand for attributes DescriptionsProps does not declare but forwards to the root
function renderDescriptions(props: DescriptionsProps & Record<string, unknown> = {}) {
    return render(() => <Descriptions data={data} {...props} />);
}

const getKeys = (container: HTMLElement) => container.querySelectorAll(`.${prefixCls}-key`);
const getValues = (container: HTMLElement) => container.querySelectorAll(`.${prefixCls}-value`);

describe('Descriptions', () => {
    afterEach(() => {
        semiGlobal.config.overrideDefaultProps = {};
    });

    it('使用 data 渲染', () => {
        const { container } = renderDescriptions();
        expect(container.querySelectorAll('tr')).toHaveLength(5);
        expect(getKeys(container)[0]).toHaveTextContent(/^实际用户数量$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1,480,000$/);
    });

    it('设置 class 与 style', () => {
        const { container } = renderDescriptions({ class: 'test', style: { height: '420px' } });
        const descriptions = container.querySelector(`.${prefixCls}`);
        expect(descriptions).toHaveClass('test');
        expect(descriptions).toHaveStyle({ height: '420px' });
    });

    it('设置 align 对齐', () => {
        for (const align of ['center', 'justify', 'left', 'plain'] as const) {
            const { container, unmount } = renderDescriptions({ align });
            expect(container.querySelector(`.${prefixCls}-${align}`)).not.toBeNull();
            unmount();
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
            const { container, unmount } = renderDescriptions({ row: true, size });
            expect(container.querySelector(`.${prefixCls}-double-${size}`)).not.toBeNull();
            unmount();
        }
    });

    it('使用 JSX 数据', () => {
        const { container } = render(() => (
            <Descriptions>
                <Descriptions.Item itemKey="实际用户数量">1,480,000</Descriptions.Item>
                <Descriptions.Item itemKey="7天留存">98%</Descriptions.Item>
                <Descriptions.Item itemKey="安全等级">3级</Descriptions.Item>
                <Descriptions.Item itemKey="垂类标签">电商</Descriptions.Item>
                <Descriptions.Item itemKey="认证状态">未认证</Descriptions.Item>
            </Descriptions>
        ));
        expect(container.querySelectorAll('tr')).toHaveLength(5);
        expect(getKeys(container)[0]).toHaveTextContent(/^实际用户数量$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1,480,000$/);
    });

    it('renderKey 与 renderValue 渲染 data 项的节点，index 含隐藏项', () => {
        const { container } = renderDescriptions({
            data: dataWithHide.slice(0, 3),
            renderKey: (item, index) => <strong>{`${index}:${item.key}`}</strong>,
            renderValue: (item) => <em>{item.value}</em>,
        });
        expect(container.querySelectorAll(`.${prefixCls}-key strong`)).toHaveLength(2);
        expect(getKeys(container)[0]).toHaveTextContent(/^1:7天留存$/);
        expect(container.querySelector(`.${prefixCls}-value em`)).toHaveTextContent(/^98%$/);
    });

    it('水平布局', () => {
        const { container } = render(() => (
            <Descriptions align="left" column={4} layout="horizontal">
                <Descriptions.Item itemKey={<strong style={{ color: 'red' }}>实际用户数量</strong>}>1,480,000</Descriptions.Item>
                <Descriptions.Item itemKey="7天留存">98%</Descriptions.Item>
                <Descriptions.Item itemKey="认证状态">未认证</Descriptions.Item>
            </Descriptions>
        ));
        const tds = container.querySelectorAll('td');
        expect(tds).toHaveLength(3);
        const ths = container.querySelectorAll('th');
        expect(ths).toHaveLength(3);
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(container.querySelector(`.${prefixCls}-horizontal`)).not.toBeNull();
        expect(getKeys(container)[0]).toHaveTextContent(/^实际用户数量$/);
        expect(getValues(container)[0]).toHaveTextContent(/^1,480,000$/);

        let totalSpan = ths.length;
        tds.forEach((item) => {
            totalSpan += Number(item.getAttribute('colspan'));
        });
        expect(totalSpan).toEqual(8);
    });

    it('data-* 透传到根 div 与条目行', () => {
        const { container } = render(() => (
            <Descriptions data-testid="desc">
                <Descriptions.Item data-row="1" itemKey="a">
                    1
                </Descriptions.Item>
            </Descriptions>
        ));
        expect(container.querySelector(`.${prefixCls}`)).toHaveAttribute('data-testid', 'desc');
        expect(container.querySelector('tr')).toHaveAttribute('data-row', '1');
    });

    it('垂直布局下 class 与 style 作用于条目行', () => {
        const { container } = render(() => (
            <Descriptions>
                <Descriptions.Item class="row-a" style={{ color: 'red' }} itemKey="a">
                    1
                </Descriptions.Item>
            </Descriptions>
        ));
        const tr = container.querySelector('tr');
        expect(tr).toHaveClass('row-a');
        expect(tr).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });

    it('不把 value 等数据项字段放到行上', () => {
        const { container } = renderDescriptions();
        for (const tr of container.querySelectorAll('tr')) {
            expect(tr.getAttributeNames()).toEqual([]);
        }
    });

    it('align 非 plain 时渲染 th 与 td，colSpan 为 span * 2 - 1', () => {
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

    it('align 为 plain 时渲染单个 td，colSpan 为 span，并带结尾冒号', () => {
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

    it('keyStyle 作用于 key，Item 调用函数值', () => {
        const { container } = render(() => <Descriptions data={[{ key: 'a', value: 'from data', keyStyle: { color: 'red' } }]} />);
        expect(getKeys(container)[0]).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        expect(getValues(container)[0]).toHaveTextContent(/^from data$/);

        const { container: jsx } = render(() => (
            <Descriptions>
                <Descriptions.Item itemKey="b">{() => 'from children'}</Descriptions.Item>
            </Descriptions>
        ));
        expect(getValues(jsx)[0]).toHaveTextContent(/^from children$/);
    });

    it('跳过以 JSX 书写的隐藏项', () => {
        const { container } = render(() => (
            <Descriptions>
                <Descriptions.Item hidden itemKey="a">
                    1
                </Descriptions.Item>
                <Descriptions.Item itemKey="b">2</Descriptions.Item>
            </Descriptions>
        ));
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(container).not.toHaveTextContent('a');
    });

    it('水平数据按 column 分行，跳过隐藏项，并拉伸最后一项', () => {
        const items = dataWithHide.map((item) => ({ ...item }));
        const { container } = renderDescriptions({ layout: 'horizontal', data: items, column: 3 });
        const rows = container.querySelectorAll('tr');
        expect(rows).toHaveLength(2);
        expect(rows[0].querySelectorAll('th')).toHaveLength(3);
        expect(rows[1].querySelectorAll('th')).toHaveLength(1);
        expect(rows[1].querySelector('td')).toHaveAttribute('colspan', '5');
        expect(container).not.toHaveTextContent('实际用户数量');
    });

    it('水平 plain 布局中 span 作为 td 的 colSpan', () => {
        const { container } = renderDescriptions({
            layout: 'horizontal',
            align: 'plain',
            column: 3,
            data: [
                { key: 'a', value: '1', span: 2 },
                { key: 'b', value: '2' },
            ],
        });
        const tds = container.querySelectorAll('td');
        expect(container.querySelectorAll('th')).toHaveLength(0);
        expect(tds[0]).toHaveAttribute('colspan', '2');
        expect(tds[1]).toHaveAttribute('colspan', '1');
        expect(getKeys(container)[1]).toHaveTextContent(/^b:$/);
    });

    it('非 Descriptions.Item 的子节点不渲染并告警，最后一个真实项填满整行', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <Descriptions column={3} layout="horizontal">
                text
                {42}
                <Descriptions.Item itemKey="a">1</Descriptions.Item>
                <Descriptions.Item itemKey="b">2</Descriptions.Item>
            </Descriptions>
        ));
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(container.querySelectorAll('th')).toHaveLength(2);
        expect([...container.querySelectorAll('td')].map((td) => td.getAttribute('colspan'))).toEqual(['1', '3']);
        expect(container).not.toHaveTextContent('text');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Descriptions.Item'));
    });

    it('横向布局展开数组里的 Item，忽略不是 Item 的元素', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(() => (
            <Descriptions column={2} layout="horizontal">
                {[<Descriptions.Item itemKey="a">1</Descriptions.Item>, <Descriptions.Item itemKey="b">2</Descriptions.Item>]}
                <Descriptions.Item itemKey="c">3</Descriptions.Item>
                <p>stray</p>
            </Descriptions>
        ));
        expect(container.querySelectorAll('tr')).toHaveLength(2);
        expect([...container.querySelectorAll('th')].map((th) => th.textContent)).toEqual(['a', 'b', 'c']);
        expect(container.querySelector('td td')).toBeNull();
        expect(container).not.toHaveTextContent('stray');
    });

    it('RTL 下 align left 在 rtl 包裹层内保留 left 类名', () => {
        const { container } = render(() => (
            <ConfigProvider direction="rtl">
                <Descriptions align="left" data={data} />
            </ConfigProvider>
        ));
        expect(container.querySelector('[dir="rtl"]')).not.toBeNull();
        expect(container.querySelector(`.${prefixCls}-left`)).not.toBeNull();
    });

    it('不修改调用方的 data，之后修改 column 会重新布局', () => {
        const items: Data[] = data.slice(0, 4).map((item) => ({ ...item }));
        const [column, setColumn] = createSignal(3);
        const { container } = render(() => <Descriptions column={column()} data={items} layout="horizontal" />);
        expect(items[3].span).toBeUndefined();
        setColumn(4);
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect([...container.querySelectorAll('td')].at(-1)).toHaveAttribute('colspan', '1');
    });

    it('layout、align 与 data 变化时更新', () => {
        const [layout, setLayout] = createSignal<'vertical' | 'horizontal'>('vertical');
        const [items, setItems] = createSignal<Data[]>(data.slice(0, 2));
        const { container } = render(() => <Descriptions data={items()} layout={layout()} column={2} />);
        expect(container.querySelectorAll('tr')).toHaveLength(2);
        setLayout('horizontal');
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        expect(container.querySelector(`.${prefixCls}-horizontal`)).not.toBeNull();
        setItems([{ key: 'x', value: 'y' }]);
        expect(getKeys(container)).toHaveLength(1);
        expect(getValues(container)[0]).toHaveTextContent(/^y$/);
    });

    it('JSX 项的 hidden 与 span 变化时更新', () => {
        const [hidden, setHidden] = createSignal(false);
        const [span, setSpan] = createSignal(1);
        const { container } = render(() => (
            <Descriptions>
                <Descriptions.Item itemKey="a" hidden={hidden()} span={span()}>
                    1
                </Descriptions.Item>
                <Descriptions.Item itemKey="b">2</Descriptions.Item>
            </Descriptions>
        ));
        expect(container.querySelectorAll('tr')).toHaveLength(2);
        setHidden(true);
        expect(container.querySelectorAll('tr')).toHaveLength(1);
        setHidden(false);
        setSpan(2);
        expect(container.querySelector('td')).toHaveAttribute('colspan', '3');
    });

    it('从 semiGlobal overrideDefaultProps 读取默认值', () => {
        semiGlobal.config.overrideDefaultProps = { Descriptions: { align: 'plain', layout: 'horizontal' } };
        const { container } = renderDescriptions();
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveClass(`${prefixCls}-plain`);
        expect(root).toHaveClass(`${prefixCls}-horizontal`);
    });

    it('ref 挂载到根 div，Descriptions.Item 的 ref 挂载到其行', () => {
        let root: HTMLDivElement | undefined;
        let row: HTMLTableRowElement | undefined;
        const { container } = render(() => (
            <Descriptions ref={(node) => (root = node)}>
                <Descriptions.Item ref={(node) => (row = node)} itemKey="a">
                    1
                </Descriptions.Item>
            </Descriptions>
        ));
        expect(root).toBe(container.querySelector(`.${prefixCls}`));
        expect(row).toBe(container.querySelector('tr'));
    });

    it('把 id、aria-label 等未声明属性透传到根 div', () => {
        const { container } = renderDescriptions({ id: 'desc', 'aria-label': 'stats' });
        const root = container.querySelector(`.${prefixCls}`);
        expect(root).toHaveAttribute('id', 'desc');
        expect(root).toHaveAttribute('aria-label', 'stats');
    });
});
