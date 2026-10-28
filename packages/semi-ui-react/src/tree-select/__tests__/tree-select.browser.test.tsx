import { useState, type SubmitEventHandler } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { BasicTreeNodeData } from '@fibrae/semi-foundation/tree/foundation';
import { Button, Tag, TagInput, TreeSelect } from '@fibrae/semi-ui-react';
import { expectThemeFocusRing, tabTo } from '@test/utils/browser';
import type { TreeSelectProps } from '../index';

const treeData = [{ label: '亚洲', value: 'Asia', key: '0', children: [{ label: '中国', value: 'China', key: '0-0' }] }];

describe('TreeSelect（浏览器）', () => {
    it('下拉面板高度受 $height-treeSelect_popover 限制，不随长树无限增长', async () => {
        const longTree = Array.from({ length: 40 }, (_, i) => ({ label: `node ${i}`, value: `v${i}`, key: `k${i}` }));
        render(<TreeSelect style={{ width: 300 }} treeData={longTree} />);
        await userEvent.click(screen.getByRole('combobox'));
        const popover = await waitFor(() => {
            const el = document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-select-popover`);
            expect(el).not.toBeNull();
            return el;
        });
        expect(getComputedStyle(popover).maxHeight).toBe('300px');
        expect(popover.getBoundingClientRect().height).toBeLessThanOrEqual(300);
    });

    it('滚动虚拟列表后渲染靠后的节点', async () => {
        const nestedTree = Array.from({ length: 30 }, (_, i) => ({
            label: `node ${i}`,
            value: `v${i}`,
            key: `k${i}`,
            children: [{ label: `leaf ${i}`, value: `v${i}-0`, key: `k${i}-0` }],
        }));
        render(<TreeSelect style={{ width: 300 }} defaultExpandAll treeData={nestedTree} virtualize={{ itemSize: 28, height: 236 }} />);
        await userEvent.click(screen.getByRole('combobox'));
        const first = await screen.findByText('node 0');
        const list = first.closest<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-virtual-list`);
        list.scrollTop = 28 * 50;
        expect(await screen.findByText('leaf 25')).toBeInTheDocument();
        expect(screen.queryByText('node 0')).toBeNull();
    });

    it('修复 #2968：禁用的 TreeSelect 点击触发器时不显示焦点边框', async () => {
        render(<TreeSelect style={{ width: 300 }} disabled placeholder="请选择" treeData={treeData} />);
        const trigger = screen.getByRole('combobox');
        // Playwright refuses to click aria-disabled elements unless forced; users can still click them
        await userEvent.click(trigger, { force: true });
        // Tooltip makes the trigger focusable, so the click really focuses it
        expect(trigger).toHaveFocus();
        expect(trigger).not.toHaveClass(`${BASE_CLASS_PREFIX}-tree-select-focus`);
        expect(getComputedStyle(trigger).borderColor).toBe('rgba(0, 0, 0, 0)');
        expect(document.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-popover`)).toBeNull();
    });

    it('触发器窄于整行时前缀文字保持单行原宽，不按字换行', () => {
        const longTree = [{ label: '一个名字很长很长的地区用来撑满整行', value: 'long', key: 'long' }];
        const { container } = render(
            <>
                <TreeSelect style={{ width: 500 }} defaultValue="long" treeData={longTree} prefix="所在地区" />
                <TreeSelect style={{ width: 160 }} defaultValue="long" treeData={longTree} prefix="所在地区" />
            </>
        );
        const [roomy, narrow] = [...container.querySelectorAll(`.${BASE_CLASS_PREFIX}-tree-select-prefix-text`)].map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
        });
        expect(narrow).toEqual(roomy);
    });
});

const prefixCls = `${BASE_CLASS_PREFIX}-tree-select`;
const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;

const regionTreeData = [
    {
        label: '亚洲',
        value: 'yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'zhongguo',
                key: 'zhongguo',
                children: [
                    { label: '北京', value: 'beijing', key: 'beijing' },
                    { label: '上海', value: 'shanghai', key: 'shanghai' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'beimeizhou',
        key: 'beimeizhou',
        children: [
            { label: '美国', value: 'meiguo', key: 'meiguo' },
            { label: '加拿大', value: 'jianada', key: 'jianada' },
        ],
    },
];
const treeDataEn = [
    {
        label: 'Asia',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: 'China',
                value: 'China',
                key: '0-0',
                children: [
                    { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
                    { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                    { label: 'Chengdu', value: 'Chengdu', key: '0-0-2' },
                ],
            },
            {
                label: 'Japan',
                value: 'Japan',
                key: '0-1',
                children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
            },
        ],
    },
    {
        label: 'North America',
        value: 'North America',
        key: '1',
        children: [
            { label: 'United States', value: 'United States', key: '1-0' },
            { label: 'Canada', value: 'Canada', key: '1-1' },
        ],
    },
];

const getPopover = () => document.querySelector<HTMLElement>(`.${prefixCls}-popover`);
const getOptions = () => document.querySelectorAll<HTMLElement>(`.${optionCls}`);
const getOption = async (label) => {
    await waitFor(() => expect(getPopover()).not.toBeNull());
    return within(getPopover()).getByText(label).closest<HTMLElement>(`.${optionCls}`);
};
const clickOption = async (label) => userEvent.click(await getOption(label));
const getTagTexts = (root: ParentNode = document) => [...root.querySelectorAll(`.${BASE_CLASS_PREFIX}-tag-content`)].map((tag) => tag.textContent);
const outside = () => screen.getByRole('button', { name: 'outside' });
// Pinned to a corner so an open dropdown never covers it
const Outside = () => <Button style={{ position: 'fixed', right: 0, bottom: 0 }}>outside</Button>;
// Playwright's type() only focuses, but the trigger opens and takes focus on click
const clickAndType = async (input, text) => {
    await userEvent.click(input);
    await userEvent.keyboard(text);
};

function LoadDataTreeSelect() {
    const [data, setData] = useState([
        { label: 'Expand to load', value: '0', key: '0' },
        { label: 'Expand to load', value: '1', key: '1' },
        { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
    ]);
    const loadData = ({ key, children }: BasicTreeNodeData) =>
        new Promise<void>((resolve) => {
            if (children) {
                resolve();
                return;
            }
            setTimeout(() => {
                setData((origin) => origin.map((node) => (node.key === key ? { ...node, children: [0, 1].map((i) => ({ label: 'Child Node', key: `${key}-${i}` })) } : node)));
                resolve();
            }, 50);
        });
    return <TreeSelect style={{ width: 300 }} placeholder="请选择" filterTreeNode loadData={loadData} treeData={data} />;
}

const checkRelationProps = {
    treeData: treeDataEn,
    filterTreeNode: true,
    showClear: true,
    checkRelation: 'unRelated' as const,
    defaultExpandAll: true,
    style: { width: 300 },
    searchPosition: 'trigger' as const,
};
const MultipleCheckRelation = () => (
    <div data-testid="multiple">
        <TreeSelect {...checkRelationProps} defaultValue={['China', 'Japan']} multiple />
    </div>
);

const triggerTreeData = [
    {
        label: '亚洲',
        value: '亚洲',
        key: '0',
        children: [
            {
                label: '中国',
                value: '中国',
                key: '0-0',
                children: [
                    { label: '北京', value: '北京', key: '0-0-0' },
                    { label: '上海', value: '上海', key: '0-0-1' },
                ],
            },
        ],
    },
    { label: '北美洲', value: '北美洲', key: '1' },
];
const renderTagInputTrigger = ({ value, onSearch, onRemove, inputValue }) => (
    <TagInput
        value={value.map((item) => item.key)}
        inputValue={inputValue}
        renderTagItem={(key) => (
            <Tag key={key} closable tagKey={key} onClose={(_v, _e, tagKey) => onRemove(tagKey)}>
                {value.find((item) => item.key === key).label}
            </Tag>
        )}
        onInputChange={onSearch}
    />
);
const TagInputTriggerTreeSelect = (props) => <TreeSelect style={{ width: 300 }} multiple defaultExpandAll filterTreeNode searchPosition="trigger" treeData={triggerTreeData} triggerRender={renderTagInputTrigger} {...props} />;

describe('treeSelect', () => {
    it('searchPosition 为 trigger', async () => {
        render(
            <>
                <TreeSelect style={{ width: 300 }} filterTreeNode searchPosition="trigger" treeData={regionTreeData} />
                <Outside />
            </>
        );
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-focus`)).not.toBeNull());
        await userEvent.click(outside());
        await waitFor(() => expect(document.querySelector(`.${prefixCls}-focus`)).toBeNull());
    });

    it('加载数据', async () => {
        render(<LoadDataTreeSelect />);
        await userEvent.click(document.querySelector(`.${prefixCls}-selection`));
        await waitFor(() => expect(getPopover()).not.toBeNull());
        await userEvent.click(getPopover().querySelector(`.${BASE_CLASS_PREFIX}-icon-tree_triangle_down`));
        await waitFor(() => expect(within(getPopover()).getAllByText('Child Node')).toHaveLength(2));
    });

    it('清空并关闭', async () => {
        render(
            <>
                <MultipleCheckRelation />
                <div data-testid="single">
                    <TreeSelect {...checkRelationProps} defaultValue="China" />
                </div>
                <Outside />
            </>
        );
        const multiple = screen.getByTestId('multiple');
        const clear = async (root) => {
            await userEvent.hover(root.querySelector(`.${prefixCls}-selection`));
            await userEvent.click(root.querySelector(`.${prefixCls}-clearbtn`));
        };

        expect(getTagTexts(multiple)).toEqual(['China', 'Japan']);
        const japanTag = within(multiple).getByText('Japan').closest(`.${BASE_CLASS_PREFIX}-tag`);
        await userEvent.click(japanTag.querySelector(`.${BASE_CLASS_PREFIX}-tag-close`));
        expect(getTagTexts(multiple)).toEqual(['China']);
        await clear(multiple);
        expect(getTagTexts(multiple)).toEqual([]);

        const multipleInput = within(multiple).getByRole('combobox');
        await clickAndType(multipleInput, 'dddd');
        await clear(multiple);
        expect(multipleInput).toHaveValue('');

        await userEvent.click(outside());
        await waitFor(() => expect(getPopover()).toBeNull());

        const single = screen.getByTestId('single');
        const singleInput = within(single).getByRole('combobox');
        await clickAndType(singleInput, 'dddd');
        await clear(single);
        expect(singleInput).toHaveValue('');
    });

    it('悬停或键盘聚焦时清空按钮替代箭头，Tab 和 Enter 可清空', async () => {
        render(<TreeSelect defaultValue="China" showClear treeData={treeData} />);
        const clear = () => document.querySelector(`.${prefixCls}-clearbtn`);
        const arrow = () => document.querySelector(`.${prefixCls}-arrow`);
        expect(clear()).not.toBeVisible();
        expect(arrow()).toBeVisible();
        await userEvent.hover(screen.getByRole('combobox'));
        expect(clear()).toBeVisible();
        expect(arrow()).not.toBeVisible();
        await userEvent.unhover(screen.getByRole('combobox'));
        expect(clear()).not.toBeVisible();

        const trigger = screen.getByRole('combobox');
        await tabTo(trigger);
        const button = screen.getByRole('button', { name: '清空已选值' });
        expect(button).toBeVisible();
        await userEvent.keyboard('{Tab}');
        expect(button).toHaveFocus();
        expectThemeFocusRing(button);
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(clear()).toBeNull());
        expect(trigger).toHaveFocus();
        expect(getPopover()).toBeNull();
    });

    it('onblur / onfocus', async () => {
        const spies = [0, 1, 2].map(() => ({
            onFocus: vi.fn<NonNullable<TreeSelectProps['onFocus']>>(),
            onBlur: vi.fn<NonNullable<TreeSelectProps['onBlur']>>(),
        }));
        // Side by side, so an open dropdown never covers the next trigger
        render(
            <div style={{ display: 'flex', gap: 20 }}>
                <TreeSelect style={{ width: 300 }} treeData={regionTreeData} {...spies[0]} />
                <TreeSelect style={{ width: 300 }} multiple treeData={regionTreeData} {...spies[1]} />
                <TreeSelect style={{ width: 300 }} filterTreeNode treeData={regionTreeData} {...spies[2]} />
            </div>
        );
        const triggers = document.querySelectorAll(`.${prefixCls}`);

        await userEvent.click(triggers[0]);
        expect(spies[0].onFocus).toHaveBeenCalledTimes(1);
        await clickOption('亚洲');
        await waitFor(() => expect(spies[0].onBlur).toHaveBeenCalledTimes(1));

        await userEvent.click(triggers[0]);
        expect(spies[0].onFocus).toHaveBeenCalledTimes(2);
        await userEvent.click(triggers[0]);
        expect(spies[0].onBlur).toHaveBeenCalledTimes(1);
        // The bug needs the dropdown gone; clicking during its exit animation still reaches the handler
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(triggers[1]);
        expect(spies[0].onBlur).toHaveBeenCalledTimes(2);

        expect(spies[1].onFocus).toHaveBeenCalledTimes(1);
        await userEvent.click(triggers[1]);
        expect(spies[1].onBlur).not.toHaveBeenCalled();
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(triggers[2]);
        expect(spies[1].onBlur).toHaveBeenCalledTimes(1);
    });

    it('filterTreeNode 与 virtualize', async () => {
        render(<TreeSelect style={{ width: 300 }} filterTreeNode searchPosition="trigger" treeData={regionTreeData} virtualize={{ itemSize: 28, height: 236 }} />);
        await userEvent.click(document.querySelector(`.${prefixCls}`));
        await clickOption('亚洲');
        expect(document.querySelector(`.${prefixCls}-selection-TriggerSearchItem`)).toHaveTextContent('亚洲');
    });

    it('treeSelect 的 clickTriggerToHide', async () => {
        const { unmount } = render(<TreeSelect style={{ width: 300 }} treeData={regionTreeData} />);
        let trigger = document.querySelector(`.${prefixCls}`);
        await userEvent.click(trigger);
        await waitFor(() => expect(getPopover()).not.toBeNull());
        await userEvent.click(trigger);
        await waitFor(() => expect(getPopover()).toBeNull());
        unmount();

        render(<TreeSelect style={{ width: 300 }} clickTriggerToHide={false} treeData={regionTreeData} />);
        trigger = document.querySelector(`.${prefixCls}`);
        await userEvent.click(trigger);
        await waitFor(() => expect(getPopover()).not.toBeNull());
        await userEvent.click(trigger);
        expect(getPopover()).not.toBeNull();
    });

    it('受控 expanded 与 showFilteredOnly', async () => {
        function Demo() {
            const [expandedKeys, setExpandedKeys] = useState([]);
            return (
                <TreeSelect
                    style={{ width: 300 }}
                    expandedKeys={expandedKeys}
                    filterTreeNode
                    searchPosition="trigger"
                    showFilteredOnly
                    treeData={treeDataEn}
                    onExpand={setExpandedKeys}
                    // Only the search result is expanded; the keys expanded by hand before the search are dropped
                    onSearch={(_inputValue, filteredExpandedKeys) => setExpandedKeys(filteredExpandedKeys)}
                />
            );
        }
        render(
            <>
                <Demo />
                <Outside />
            </>
        );
        const input = screen.getByRole('combobox');
        const expectOptionCount = (count) => waitFor(() => expect(getOptions()).toHaveLength(count));
        const close = async () => {
            await userEvent.click(outside());
            await waitFor(() => expect(getPopover()).toBeNull());
        };

        await clickAndType(input, 'b');
        await expectOptionCount(3);
        await userEvent.clear(input);
        await expectOptionCount(2);
        // The input still has focus; a click would close the open dropdown
        await userEvent.keyboard('s');
        await expectOptionCount(9);
        await userEvent.click(getOptions()[1].querySelector(`.${BASE_CLASS_PREFIX}-icon-tree_triangle_down`));
        await expectOptionCount(6);
        await close();

        await userEvent.click(document.querySelector(`.${prefixCls}-selection`));
        await expectOptionCount(2);
        await close();

        await clickAndType(input, 'o');
        await expectOptionCount(4);
        await userEvent.click(getOptions()[3]);
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(document.querySelector(`.${prefixCls}-selection`));
        await expectOptionCount(2);
        await userEvent.click(getPopover().querySelector(`.${BASE_CLASS_PREFIX}-icon-tree_triangle_down`));
        await expectOptionCount(4);
    });

    it('filterTreeNode 与 loadData', async () => {
        render(<LoadDataTreeSelect />);
        const selection = document.querySelector(`.${prefixCls}-selection`);
        await userEvent.click(selection);
        await waitFor(() => expect(getOptions().length).toBeGreaterThan(0));
        await userEvent.click(getOptions()[0]);
        await waitFor(() => expect(document.querySelector(`.${optionCls}-list`)).toBeNull());
        await userEvent.click(selection);
        await waitFor(() => expect(document.querySelector(`.${optionCls}.${optionCls}-level-1.${optionCls}-selected.${optionCls}-collapsed`)).not.toBeNull());
    });

    it('multiple，checkRelation 为 unRelated，triggerRender', async () => {
        render(<TagInputTriggerTreeSelect checkRelation="unRelated" />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput`));
        await clickOption('北京');
        await clickOption('上海');
        expect(getTagTexts()).toEqual(['北京', '上海']);
    });

    it('multiple，checkRelation 为 related，triggerRender', async () => {
        render(<TagInputTriggerTreeSelect />);
        await userEvent.click(document.querySelector(`.${BASE_CLASS_PREFIX}-tagInput`));
        await clickOption('北京');
        await clickOption('上海');
        expect(getTagTexts()).toEqual(['亚洲']);
    });

    it('single，triggerRender', async () => {
        render(<TreeSelect style={{ width: 300 }} placeholder="Single, Custom Trigger" treeData={triggerTreeData} triggerRender={({ value, placeholder }) => <Button>{value && value.length ? value.map((item) => item.label).join('，') : placeholder}</Button>} />);
        await userEvent.click(screen.getByRole('button', { name: 'Single, Custom Trigger' }));
        await clickOption('亚洲');
        await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('亚洲'));
    });

    it('默认展开', async () => {
        render(
            <>
                <TreeSelect style={{ width: 300 }} multiple defaultExpandAll defaultOpen motion={false} treeData={regionTreeData} />
                <Outside />
            </>
        );
        expect(document.querySelectorAll(`.${prefixCls}-popover`)).toHaveLength(1);
        await userEvent.click(outside());
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('Esc 关闭面板', async () => {
        render(<TreeSelect style={{ width: 300 }} filterTreeNode searchPosition="trigger" treeData={regionTreeData} virtualize={{ itemSize: 28, height: 236 }} />);
        await clickAndType(screen.getByRole('combobox'), '中');
        await waitFor(() => expect(document.querySelectorAll(`.${prefixCls}-popover`)).toHaveLength(1));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopover()).toBeNull());
    });

    it('showFilteredOnly 与 trigger 中的 searchPosition', async () => {
        render(<TreeSelect style={{ width: 300 }} multiple filterTreeNode maxTagCount={2} searchPosition="trigger" showFilteredOnly treeData={regionTreeData} />);
        const input = screen.getByRole('combobox');
        await clickAndType(input, '上');
        await waitFor(() => expect(getOptions()).toHaveLength(3));
        await userEvent.clear(input);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(getPopover()).toBeNull());
        await userEvent.click(document.querySelector(`.${prefixCls}-selection`));
        await waitFor(() => expect(getOptions()).toHaveLength(2));
    });

    it('鼠标点选节点关闭弹层后，焦点仍在触发器上', async () => {
        render(<TreeSelect style={{ width: 300 }} motion={false} treeData={regionTreeData} />);
        const trigger = screen.getByRole('combobox');
        await userEvent.click(trigger);
        await clickOption('北美洲');
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it('焦点在下拉搜索框时鼠标点选节点，关闭后焦点回到触发器', async () => {
        render(<TreeSelect style={{ width: 300 }} filterTreeNode motion={false} searchAutoFocus treeData={regionTreeData} />);
        const trigger = screen.getByRole('combobox');
        await userEvent.click(trigger);
        await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
        await clickOption('北美洲');
        await waitFor(() => expect(getPopover()).toBeNull());
        expect(trigger).toHaveFocus();
    });

    it.each([
        ['普通列表', {}],
        ['虚拟列表', { virtualize: { itemSize: 28, height: 236 } }],
    ])('关闭时按 End 打开，当前行滚动到可视区（%s）', async (_, props) => {
        const longTree = Array.from({ length: 40 }, (_, i) => ({ label: `node ${i}`, value: `v${i}`, key: `k${i}` }));
        render(<TreeSelect style={{ width: 300 }} motion={false} treeData={longTree} {...props} />);
        const trigger = screen.getByRole('combobox');
        await tabTo(trigger);
        await userEvent.keyboard('{End}');
        await waitFor(() => {
            const row = document.getElementById(trigger.getAttribute('aria-activedescendant'));
            expect(row).toHaveTextContent('node 39');
            expect(row.getBoundingClientRect().bottom).toBeLessThanOrEqual(getPopover().getBoundingClientRect().bottom + 1);
        });
    });

    it('ShadowRoot 内关闭时按 End 打开，当前行滚动到可视区', async () => {
        const longTree = Array.from({ length: 40 }, (_, i) => ({ label: `node ${i}`, value: `v${i}`, key: `k${i}` }));
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        // the popup scrolls only under the component styles, which the document holds
        shadow.append(...Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'), (node) => node.cloneNode(true)));
        const mount = document.createElement('div');
        shadow.append(mount);
        const view = render(<TreeSelect style={{ width: 300 }} motion={false} treeData={longTree} />, { container: mount });
        try {
            const trigger = shadow.querySelector<HTMLElement>('[role="combobox"]');
            trigger.focus();
            await userEvent.keyboard('{End}');
            await waitFor(() => {
                const row = shadow.getElementById(trigger.getAttribute('aria-activedescendant'));
                expect(row).toHaveTextContent('node 39');
                expect(row.getBoundingClientRect().bottom).toBeLessThanOrEqual(shadow.querySelector(`.${BASE_CLASS_PREFIX}-tree-select-popover`).getBoundingClientRect().bottom + 1);
            });
        } finally {
            view.unmount();
            host.remove();
        }
    });

    it('关闭动画结束前重新打开，列表回到完整的树', async () => {
        render(<TreeSelect style={{ width: 300 }} filterTreeNode searchPosition="trigger" showFilteredOnly treeData={regionTreeData} />);
        await clickAndType(screen.getByRole('combobox'), '上');
        await waitFor(() => expect(getOptions()).toHaveLength(3));
        // one keyboard() call sends both keys inside the exit animation
        await userEvent.keyboard('{Escape}{ArrowDown}');
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(within(getPopover()).getByText('北美洲')).toBeInTheDocument());
    });

    it('keyMaps 与搜索', async () => {
        const rename = (nodes) =>
            nodes.map(({ label, children, ...node }) => ({
                ...node,
                name: label,
                ...(children && { children: rename(children) }),
            }));
        render(<TreeSelect style={{ width: 300 }} filterTreeNode keyMaps={{ key: 'key', value: 'value', label: 'name' }} treeData={rename(treeDataEn)} />);
        await userEvent.click(document.querySelector(`.${prefixCls}`));
        await waitFor(() => expect(getPopover()).not.toBeNull());
        await clickAndType(within(getPopover()).getByRole('textbox'), '1');
        await userEvent.click(getPopover().querySelector<HTMLElement>(`.${optionCls}-expand-icon`));
        expect(getPopover().querySelector(`.${optionCls}-label-text`)).toHaveTextContent('Asia');
    });

    it.each([
        ['single', {}],
        ['multiple', { multiple: true }],
    ])('%s 触发器显示主题焦点环', async (_, props) => {
        render(<TreeSelect style={{ width: 300 }} placeholder="请选择" treeData={treeData} {...props} />);
        const trigger = screen.getByRole('combobox');
        await tabTo(trigger);
        expectThemeFocusRing(trigger);
    });

    it('方向键移到的行显示主题焦点环，选中后焦点保持在触发器上', async () => {
        render(<TreeSelect style={{ width: 300 }} motion={false} treeData={treeData} />);
        const trigger = screen.getByRole('combobox');
        await tabTo(trigger);
        await userEvent.keyboard('{Enter}');
        await screen.findByRole('tree');
        await userEvent.keyboard('{ArrowDown}');
        const row = () => document.getElementById(trigger.getAttribute('aria-activedescendant'));
        await waitFor(() => expect(row()).toHaveTextContent('亚洲'));
        expectThemeFocusRing(row());
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        expect(trigger).toHaveTextContent('亚洲');
        expect(trigger).toHaveFocus();
    });

    it('搜索框位于触发器上时，一次 Tab 即可到达，之后按键直接操作树', async () => {
        render(
            <>
                <Button>before</Button>
                <TreeSelect style={{ width: 300 }} filterTreeNode motion={false} searchPosition="trigger" treeData={treeData} />
            </>
        );
        await tabTo(screen.getByRole('button', { name: 'before' }));
        await userEvent.keyboard('{Tab}');
        const combobox = screen.getByRole('combobox');
        expect(combobox.tagName).toBe('INPUT');
        expect(combobox).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await screen.findByRole('tree');
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(document.getElementById(combobox.getAttribute('aria-activedescendant'))).toHaveTextContent('亚洲'));
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.queryByRole('tree')).toBeNull());
        expect(combobox).toHaveAccessibleDescription('亚洲');
        // a press on the trigger outside the input keeps focus, and the typed text, in the input
        await userEvent.type(combobox, '中');
        await userEvent.click(document.querySelector(`.${prefixCls}-arrow`));
        expect(combobox).toHaveFocus();
        expect(combobox).toHaveValue('中');
    });

    it.each([
        ['input', 'input'],
        ['textarea', 'textarea'],
    ] as const)('自定义 searchRender 的 %s 位于触发器内时，点击已选文本把焦点交给它', async (_, tag) => {
        const Field = tag;
        render(
            <>
                <input aria-label="other" />
                <TreeSelect
                    style={{ width: 300 }}
                    defaultValue="Asia"
                    filterTreeNode
                    motion={false}
                    searchPosition="trigger"
                    treeData={treeData}
                    searchRender={({ ref, value, onChange, onBlur, onFocus, ...rest }) => <Field ref={ref as never} aria-label="custom search" role={rest.role} value={value} onBlur={onBlur as never} onChange={(e) => onChange(e.target.value, e as never)} onFocus={onFocus as never} />}
                />
            </>
        );
        await userEvent.click(screen.getByLabelText('other'));
        await userEvent.click(screen.getByText('亚洲'));
        expect(screen.getByLabelText('custom search')).toHaveFocus();
        // a press on the custom editor itself is left to the browser
        await userEvent.click(screen.getByLabelText('other'));
        await userEvent.click(screen.getByLabelText('custom search'));
        expect(screen.getByLabelText('custom search')).toHaveFocus();
    });

    // the input draws no focus style of its own, so the trigger around it has to show where keyboard focus is
    it.each([
        ['single', {}],
        ['multiple', { multiple: true }],
    ])('搜索框位于 %s 触发器上时，键盘聚焦显示主题焦点环', async (_, props) => {
        const { container } = render(<TreeSelect style={{ width: 300 }} filterTreeNode searchPosition="trigger" treeData={treeData} {...props} />);
        await tabTo(screen.getByRole('combobox'));
        expectThemeFocusRing(container.querySelector(`.${prefixCls}`));
    });
});

describe.each([
    ['single', { defaultValue: 'beijing' }],
    ['multiple', { defaultValue: ['beijing'], multiple: true }],
    ['searchable', { defaultValue: 'beijing', filterTreeNode: true, searchPosition: 'trigger' as const }],
])('焦点在 %s TreeSelect 与其清空按钮之间移动时保持在内部', (_, props) => {
    const renderWithSpies = () => {
        const spies = {
            onFocus: vi.fn<NonNullable<TreeSelectProps['onFocus']>>(),
            onBlur: vi.fn<NonNullable<TreeSelectProps['onBlur']>>(),
        };
        render(
            <>
                <TreeSelect style={{ width: 300 }} showClear treeData={regionTreeData} {...spies} {...props} />
                <Button>after</Button>
            </>
        );
        return spies;
    };
    const getClear = () => document.querySelector(`.${prefixCls}-clearbtn`);
    const getRoot = () => document.querySelector(`.${prefixCls}`);
    const tabToClearAndBack = async () => {
        await tabTo(getClear());
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(getRoot().contains(document.activeElement)).toBe(true);
    };

    it('Tab 进入触发一次 onFocus，到清空按钮再回来不再触发 onFocus 或 onBlur，弹层保持关闭', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await tabToClearAndBack();
        expect(getPopover()).toBeNull();
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('点击打开弹层后，Tab 到清空按钮再回来时弹层保持打开，且不触发 onBlur', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await userEvent.click(screen.getByRole('combobox'));
        await waitFor(() => expect(getPopover()).not.toBeNull());
        await tabToClearAndBack();
        expect(getPopover()).not.toBeNull();
        expect(getRoot()).toHaveClass(`${prefixCls}-focus`);
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('Tab 能离开 TreeSelect 到达下一个控件', async () => {
        renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await tabTo(screen.getByRole('button', { name: 'after' }));
        expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
    });

    it('Tab 进入再 Tab 离开时 onFocus 与 onBlur 各触发一次', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await tabTo(screen.getByRole('button', { name: 'after' }));
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('打开下拉、Escape 关闭后 Tab 离开，onFocus 与 onBlur 各触发一次', async () => {
        const { onFocus, onBlur } = renderWithSpies();
        await tabTo(screen.getByRole('combobox'));
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(getPopover()).not.toBeNull());
        await userEvent.keyboard('{Escape}');
        await tabTo(screen.getByRole('button', { name: 'after' }));
        expect(onFocus).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});

it('焦点在弹层搜索框时按 Escape 关闭，焦点回到触发器，不额外触发 onBlur 与 onFocus', async () => {
    const onFocus = vi.fn<() => void>();
    const onBlur = vi.fn<() => void>();
    const { container } = render(<TreeSelect style={{ width: 300 }} filterTreeNode treeData={regionTreeData} onBlur={onBlur} onFocus={onFocus} />);
    await userEvent.click(screen.getByRole('combobox'));
    await waitFor(() => expect(getPopover()).not.toBeNull());
    const search = (getPopover() as HTMLElement).querySelector('input') as HTMLInputElement;
    await userEvent.click(search);
    expect(search).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(getPopover()).toBeNull());
    expect(container.querySelector(`.${prefixCls}`)?.contains(document.activeElement)).toBe(true);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
});

it('从 TreeSelect 搜索框 Tab 到清空按钮再回来，已输入的文本保留', async () => {
    render(<TreeSelect style={{ width: 300 }} filterTreeNode searchPosition="trigger" showClear treeData={regionTreeData} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('北');
    const input = screen.getByRole('combobox');
    await waitFor(() => expect(input).toHaveValue('北'));
    await userEvent.keyboard('{Tab}');
    expect(document.querySelector(`.${prefixCls}-clearbtn`)).toHaveFocus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('北');
});

it('大数据量搜索后立即按 Enter，选中的正是 aria-activedescendant 指向的、匹配关键字的节点', async () => {
    // the list renders the keyword with useDeferredValue; a large tree keeps the old rows on screen for a while
    const data = Array.from({ length: 3000 }, (_, i) => ({ label: `Option ${i}`, value: `v${i}`, key: `k${i}` }));
    const onSelect = vi.fn<NonNullable<TreeSelectProps['onSelect']>>();
    render(<TreeSelect style={{ width: 300 }} filterTreeNode searchPosition="trigger" showFilteredOnly treeData={data} onSelect={onSelect} />);
    let atEnter: string | undefined;
    const record = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            const id = document.activeElement?.getAttribute('aria-activedescendant');
            atEnter = id ? document.getElementById(id)?.textContent : undefined;
        }
    };
    document.addEventListener('keydown', record, true);
    try {
        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.keyboard('9{ArrowDown}{Enter}');
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    } finally {
        document.removeEventListener('keydown', record, true);
    }
    const label = data.find((node) => node.key === onSelect.mock.calls[0][0]).label;
    expect(label).toBe(atEnter);
    expect(label).toContain('9');
});

it('在触发器搜索框按 Enter 打开下拉框，且不提交外层表单', async () => {
    const onSubmit = vi.fn<SubmitEventHandler>((e) => e.preventDefault());
    render(
        <form onSubmit={onSubmit}>
            <TreeSelect placeholder="tree" filterTreeNode searchPosition="trigger" treeData={treeData} />
            <button type="submit">submit</button>
        </form>
    );
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelector('[role="tree"]')).not.toBeNull());
    expect(onSubmit).not.toHaveBeenCalled();
});
