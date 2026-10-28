/** @jsxImportSource vue */
import { defineComponent, KeepAlive, nextTick, shallowRef, type VNode } from 'vue';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/vue';
import { describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { IconMapPin } from '@fibrae/semi-icons-vue';
import { render } from '@test/utils/vue';
import Tree, { type TreeExpandIconSlotProps, type TreeFullLabelSlotProps, type TreeLabelSlotProps, type TreeNodeData, type TreeProps, type TreeSearchSlotProps, type TreeValue } from '..';
import semiGlobal from '../../_utils/semi-global';
import { collapsedCls, getExpandIcon, getHighlights, getNode, getSearchWrapper, optionCls, renderTree, renderWith, selectedCls, spyOn, treeData } from './fixtures/data';
import Stateful from './fixtures/stateful.vue';

const activeElement = () => document.getElementById(screen.getByRole('tree').getAttribute('aria-activedescendant') ?? '');

describe('Tree（Vue）', () => {
    it('v-model：点击行后父组件的值更新', async () => {
        renderWith(Stateful, { treeData, defaultExpandAll: true });
        await userEvent.click(getNode('beijing'));
        expect(screen.getByTestId('value')).toHaveTextContent('"Beijing"');
        expect(getNode('beijing')).toHaveClass(selectedCls);
        await userEvent.click(getNode('meiguo'));
        expect(screen.getByTestId('value')).toHaveTextContent('"Meiguo"');
        expect(getNode('beijing')).not.toHaveClass(selectedCls);
    });

    it('单向 :modelValue 不自行改变选中', async () => {
        const onUpdate = spyOn<'update:modelValue'>();
        renderTree({ modelValue: 'Beijing', defaultExpandAll: true, 'onUpdate:modelValue': onUpdate });
        await userEvent.click(getNode('meiguo'));
        expect(onUpdate).toHaveBeenCalledWith('Meiguo');
        expect(getNode('beijing')).toHaveClass(selectedCls);
        expect(getNode('meiguo')).not.toHaveClass(selectedCls);
    });

    it('v-model:expandedKeys 双向', async () => {
        const { handle } = renderWith<{ expandedKeys: string[] | undefined }>(Stateful, {
            treeData,
            motion: false,
            initialExpandedKeys: ['beimeizhou'],
        });
        expect(getNode('meiguo')).not.toBeNull();
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        expect(handle().expandedKeys).toEqual(['beimeizhou', 'yazhou']);
        expect(getNode('zhongguo')).not.toBeNull();
        await userEvent.click(getExpandIcon(getNode('beimeizhou')));
        expect(handle().expandedKeys).toEqual(['yazhou']);
        expect(getNode('meiguo')).toBeNull();
    });

    it('全局默认值：semiDefault、semiGlobalDefault 与函数 prop 都读 semiGlobal.Tree', () => {
        semiGlobal.config.overrideDefaultProps = {
            Tree: { blockNode: false, searchPlaceholder: 'global placeholder', filterTreeNode: true },
        };
        try {
            renderTree();
            expect(document.querySelector(`.${optionCls}-list`)).not.toHaveClass(`${optionCls}-list-block`);
            expect(getSearchWrapper()).not.toBeNull();
            expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'global placeholder');
        } finally {
            semiGlobal.config.overrideDefaultProps = {};
        }
    });

    it('aria-* 落在 tree，data-*、class 与原生监听器落在根元素', async () => {
        const onMouseenter = vi.fn<() => void>();
        const { container } = renderTree({
            'aria-labelledby': 'title',
            'data-testid': 'tree',
            class: 'own',
            onMouseenter,
        });
        const wrapper = container.firstElementChild as HTMLElement;
        expect(screen.getByRole('tree')).toHaveAttribute('aria-labelledby', 'title');
        expect(wrapper).not.toHaveAttribute('aria-labelledby');
        expect(wrapper).toHaveAttribute('data-testid', 'tree');
        expect(wrapper).toHaveClass('own', `${BASE_CLASS_PREFIX}-tree-wrapper`);
        await fireEvent.mouseEnter(wrapper);
        expect(onMouseenter).toHaveBeenCalledTimes(1);
    });

    it('#label 在搜索时收到 searchWord；不用插槽时数字标签也会高亮', async () => {
        const label = vi.fn<(scope: TreeLabelSlotProps) => string>(({ label: text }) => `[${text}]`);
        const { handle, unmount } = renderTree({ filterTreeNode: true }, { label });
        handle().search('北');
        await nextTick();
        expect(label).toHaveBeenLastCalledWith(expect.objectContaining({ searchWord: '北' }));
        expect(getNode('beijing')).toHaveTextContent('[北京]');
        expect(getHighlights()).toHaveLength(0);
        unmount();

        const numbered = renderTree({ filterTreeNode: true, treeData: [{ label: 2024, value: 'y', key: 'y' }] });
        numbered.handle().search('20');
        await nextTick();
        expect(getHighlights()).toHaveLength(1);
        expect(getHighlights()[0]).toHaveTextContent(/^20$/);
    });

    it('#icon 插槽覆盖目录模式的内置图标，空内容保留内置图标', () => {
        renderTree({ directory: true, defaultExpandAll: true }, { icon: ({ isLeaf }: { isLeaf: boolean }) => (isLeaf ? <IconMapPin /> : null) });
        expect(getNode('beijing').querySelector(`.${BASE_CLASS_PREFIX}-icon-map_pin`)).not.toBeNull();
        expect(getNode('beijing').querySelector(`.${BASE_CLASS_PREFIX}-icon-file`)).toBeNull();
        expect(getNode('yazhou').querySelector(`.${BASE_CLASS_PREFIX}-icon-folder_open`)).not.toBeNull();
    });

    it('#expandIcon 单元素合并 class 与 onClick，点击只展开一次', async () => {
        const onExpand = spyOn<'expand'>();
        renderTree(
            { motion: false, onExpand },
            {
                expandIcon: ({ onClick, class: cls }: TreeExpandIconSlotProps) => (
                    <span class={[cls, 'own']} onClick={onClick}>
                        {'>'}
                    </span>
                ),
            }
        );
        const icon = getExpandIcon(getNode('yazhou'));
        expect(icon).toHaveClass('own');
        await userEvent.click(icon);
        expect(onExpand).toHaveBeenCalledTimes(1);
        expect(getNode('yazhou')).not.toHaveClass(collapsedCls);
    });

    it('#fullLabel 返回文本时由 treeitem 包住，aria-activedescendant 指向存在的行', async () => {
        renderTree({}, { fullLabel: ({ data }: TreeFullLabelSlotProps) => `row ${data.key}` });
        const rows = screen.getAllByRole('treeitem');
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveTextContent(/^row yazhou$/);
        expect(rows[0].id).not.toBe('');
        expect(rows[0]).toHaveAttribute('aria-level', '1');
        expect(activeElement()).toBe(rows[0]);
        screen.getByRole('tree').focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(activeElement()).toBe(rows[1]);
    });

    it('#search 插槽收到搜索框的参数；空 #emptyContent 隐藏空状态', async () => {
        const searchSlot = ({ modelValue, onChange, placeholder }: TreeSearchSlotProps) => <input aria-label="find" placeholder={placeholder} value={modelValue} onInput={(event: Event) => onChange((event.target as HTMLInputElement).value)} />;
        renderTree({ filterTreeNode: true, showFilteredOnly: true }, { search: searchSlot, emptyContent: () => [] });
        const input = screen.getByRole('textbox', { name: 'find' });
        expect(getSearchWrapper()).toContainElement(input);
        await fireEvent.update(input, '东京');
        expect(getNode('dongjing')).not.toBeNull();
        await fireEvent.update(input, 'none');
        expect(document.querySelector(`.${optionCls}-list`)).toBeNull();
        expect(screen.queryByRole('tree')).toBeNull();
    });

    it('@drop 只收到组件的载荷，不收到原生 drop', async () => {
        const onDrop = spyOn<'drop'>();
        const { container } = renderTree({ draggable: true, onDrop });
        await fireEvent.drop(container.firstElementChild as HTMLElement);
        expect(onDrop).not.toHaveBeenCalled();
        await fireEvent.dragStart(getNode('yazhou'));
        await fireEvent.drop(getNode('beimeizhou'));
        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith(
            expect.objectContaining({
                node: expect.objectContaining({ key: 'beimeizhou' }),
                dragNode: expect.anything(),
            })
        );
    });

    it('受控 props 连续变化时没有 Vue 告警', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const { rerender } = renderTree({ modelValue: 'Beijing', expandedKeys: ['yazhou'] });
            await rerender({ expandedKeys: ['yazhou', 'zhongguo'] });
            await rerender({ modelValue: 'Shanghai' });
            await rerender({ treeData: [...treeData, { label: '非洲', value: 'Feizhou', key: 'feizhou' }] });
            await rerender({ expandedKeys: ['beimeizhou'], modelValue: 'Meiguo' });
            expect(getNode('meiguo')).toHaveClass(selectedCls);
            expect(getNode('feizhou')).not.toBeNull();
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it('一次点击只触发一次 select、change 与 expand', async () => {
        const onSelect = spyOn<'select'>();
        const onChange = spyOn<'change'>();
        const onExpand = spyOn<'expand'>();
        renderTree({ motion: false, expandAction: 'click', onSelect, onChange, onExpand });
        await userEvent.click(getNode('yazhou'));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onExpand).toHaveBeenCalledTimes(1);
        await userEvent.click(getExpandIcon(getNode('zhongguo')));
        expect(onExpand).toHaveBeenCalledTimes(2);
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('数字标签参与键入跳转', async () => {
        renderTree({
            treeData: [
                { label: 'alpha', value: 'a', key: 'a' },
                { label: 2024, value: 'y', key: 'y' },
            ],
        });
        screen.getByRole('tree').focus();
        await userEvent.keyboard('2');
        expect(activeElement()).toBe(getNode('y'));
    });

    it('指针点击的行成为键盘当前行', async () => {
        renderTree({ defaultExpandAll: true });
        await userEvent.click(getNode('riben'));
        expect(activeElement()).toBe(getNode('riben'));
        await userEvent.keyboard('{ArrowDown}');
        expect(activeElement()).toBe(getNode('dongjing'));
    });

    it('点击展开箭头的行成为键盘当前行', async () => {
        renderTree({ motion: false });
        await userEvent.click(getExpandIcon(getNode('beimeizhou')));
        expect(activeElement()).toBe(getNode('beimeizhou'));
        await userEvent.keyboard('{ArrowDown}');
        expect(activeElement()).toBe(getNode('meiguo'));
    });

    it('多选时点击复选框的行成为键盘当前行', async () => {
        renderTree({ multiple: true, defaultExpandAll: true });
        await userEvent.click(getNode('riben').querySelector(`.${BASE_CLASS_PREFIX}-checkbox`) as HTMLElement);
        expect(getNode('riben')).toHaveAttribute('aria-checked', 'true');
        expect(activeElement()).toBe(getNode('riben'));
    });

    it('右键与双击的行成为键盘当前行', async () => {
        renderTree({ defaultExpandAll: true });
        await fireEvent.contextMenu(getNode('riben'));
        expect(activeElement()).toBe(getNode('riben'));
        await fireEvent.dblClick(getNode('meiguo'));
        expect(activeElement()).toBe(getNode('meiguo'));
    });

    it('v-model:loadedKeys：回写后节点视为已加载，不再显示箭头，再次展开不重复加载', async () => {
        const loadedKeys = shallowRef<string[]>([]);
        const data = shallowRef<TreeNodeData[]>([
            { label: 'A', value: 'a', key: 'a' },
            { label: 'B', value: 'b', key: 'b' },
        ]);
        const loadData = vi.fn<NonNullable<TreeProps['loadData']>>((node) => {
            if (node?.key === 'b') {
                data.value = [data.value[0], { ...data.value[1], children: [{ label: 'B1', value: 'b1', key: 'b1' }] }];
            }
            return Promise.resolve();
        });
        const Host = defineComponent({
            setup: () => () => (
                <Tree
                    loadData={loadData}
                    loadedKeys={loadedKeys.value}
                    motion={false}
                    treeData={data.value}
                    onUpdate:loadedKeys={(keys: string[]) => {
                        loadedKeys.value = keys;
                    }}
                />
            ),
        });
        render(Host);
        await userEvent.click(getExpandIcon(getNode('a')));
        await waitFor(() => expect(loadedKeys.value).toEqual(['a']));
        await nextTick();
        expect(getExpandIcon(getNode('a'))).toBeNull();
        await userEvent.click(getExpandIcon(getNode('b')));
        await waitFor(() => expect(getNode('b1')).not.toBeNull());
        expect(loadedKeys.value).toEqual(['a', 'b']);
        await userEvent.click(getExpandIcon(getNode('b')));
        expect(getNode('b1')).toBeNull();
        await userEvent.click(getExpandIcon(getNode('b')));
        expect(getNode('b1')).not.toBeNull();
        expect(loadData).toHaveBeenCalledTimes(2);
    });

    it('插槽参数只含声明的字段', () => {
        const seen: Record<string, string[]> = {};
        const record = (name: string) => (scope: object) => {
            seen[name] = Object.keys(scope).sort();
            return name;
        };
        const { unmount } = renderTree({}, { label: record('label'), icon: record('icon'), expandIcon: record('expandIcon') });
        expect(seen).toEqual({
            label: ['item', 'label', 'searchWord'],
            icon: ['checked', 'expanded', 'halfChecked', 'isLeaf', 'item', 'level', 'loading', 'selected'],
            expandIcon: ['class', 'expanded', 'onClick'],
        });
        unmount();
        renderTree({}, { fullLabel: record('fullLabel') });
        expect(seen.fullLabel).toEqual(['checkStatus', 'class', 'data', 'expandIcon', 'expandStatus', 'filtered', 'level', 'onCheck', 'onClick', 'onContextmenu', 'onDblclick', 'onExpand', 'searchWord']);
    });

    it('类型：节点不带 icon 字段，#fullLabel 的 class 是字符串', () => {
        expectTypeOf<{ icon: VNode }>().not.toExtend<TreeNodeData>();
        expectTypeOf<TreeFullLabelSlotProps['class']>().toEqualTypeOf<string>();
    });

    it('KeepAlive 中停用再激活后保留展开状态并继续响应', async () => {
        const shown = shallowRef(true);
        const onChange = vi.fn<(value: TreeValue) => void>();
        const Host = defineComponent({
            setup: () => () => <KeepAlive>{() => (shown.value ? <Tree treeData={treeData} motion={false} onChange={onChange} /> : <p>other</p>)}</KeepAlive>,
        });
        render(Host);
        await userEvent.click(getExpandIcon(getNode('yazhou')));
        shown.value = false;
        await nextTick();
        expect(screen.queryByRole('tree')).toBeNull();
        shown.value = true;
        await nextTick();
        expect(getNode('zhongguo')).not.toBeNull();
        await userEvent.click(getNode('zhongguo'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('Zhongguo');
    });
});
