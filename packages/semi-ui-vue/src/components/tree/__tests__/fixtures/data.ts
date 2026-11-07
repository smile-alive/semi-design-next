import { h, type Component, type VNodeChild } from 'vue';
import { fireEvent, screen } from '@testing-library/vue';
import { vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { render } from '@test/utils/vue';
import Tree, { type TreeEmits, type TreeHandle, type TreeNodeData } from '../..';
import ConfigProvider from '../../../config-provider';

export type Slots = Record<string, (scope: never) => VNodeChild>;

/** A spy typed as the listener of one Tree emit */
export const spyOn = <K extends keyof TreeEmits>(impl?: (...args: TreeEmits[K]) => unknown) => vi.fn<(...args: TreeEmits[K]) => unknown>(impl);

/**
 * Renders under an en_US ConfigProvider (and `provider` props such as direction); `handle` is the exposed handle.
 * Props, listeners and attributes all go to the component.
 */
export function renderWith<Handle = TreeHandle>(component: Component, props: Record<string, unknown> = {}, slots: Slots = {}, provider: Record<string, unknown> = {}) {
    let handle: Handle | undefined;
    const capture = (value: unknown) => {
        if (value) handle = value as Handle;
    };
    const Host = (attrs: Record<string, unknown>) => h(ConfigProvider, { locale: en_US, ...provider }, () => h(component, { ...attrs, ref: capture }, slots));
    const view = render(Host, { props });
    return {
        container: view.container,
        handle: () => handle as Handle,
        rerender: (next: Record<string, unknown>) => view.rerender(next),
        unmount: () => view.unmount(),
    };
}
export const renderTree = (props: Record<string, unknown> = {}, slots: Slots = {}, provider = {}) => renderWith(Tree as Component, { treeData, ...props }, slots, provider);

const treeChildren = [
    { label: '北京', value: 'Beijing', key: 'beijing' },
    { label: '上海', value: 'Shanghai', key: 'shanghai' },
];

export const treeData: TreeNodeData[] = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            { label: '中国', value: 'Zhongguo', key: 'zhongguo', children: treeChildren },
            {
                label: '日本',
                value: 'Riben',
                key: 'riben',
                children: [
                    { label: '东京', value: 'Dongjing', key: 'dongjing' },
                    { label: '大阪', value: 'Daban', key: 'daban' },
                ],
            },
        ],
    },
    {
        label: '北美洲',
        value: 'Beimeizhou',
        key: 'beimeizhou',
        children: [
            { label: '美国', value: 'Meiguo', key: 'meiguo' },
            { label: '加拿大', value: 'Jianada', key: 'jianada' },
        ],
    },
];

export const treeData2: TreeNodeData[] = [
    {
        label: '亚洲',
        value: 'Asia',
        key: '0',
        children: [
            {
                label: '中国',
                value: 'China',
                key: '0-0',
                children: [
                    { label: '北京', value: 'Beijing', key: '0-0-0' },
                    { label: '上海', value: 'Shanghai', key: '0-0-1' },
                ],
            },
        ],
    },
    { label: '北美洲', value: 'North America', key: '1' },
];

export const specialTreeData: TreeNodeData[] = [
    {
        label1: '亚洲',
        value1: 'Yazhou',
        key1: 'yazhou',
        children1: [
            {
                label1: '中国',
                value1: 'Zhongguo',
                key1: 'zhongguo',
                disabled1: true,
                children1: [
                    { label1: '北京', value1: 'Beijing', key1: 'beijing' },
                    { label1: '上海', value1: 'Shanghai', key1: 'shanghai' },
                ],
            },
            {
                label1: '日本',
                value1: 'Riben',
                key1: 'riben',
                children1: [
                    { label1: '东京', value1: 'Dongjing', key1: 'dongjing' },
                    { label1: '大阪', value1: 'Daban', key1: 'daban' },
                ],
            },
        ],
    },
    {
        label1: '北美洲',
        value1: 'Beimeizhou',
        key1: 'beimeizhou',
        children1: [
            { label1: '美国', value1: 'Meiguo', key1: 'meiguo' },
            { label1: '加拿大', value1: 'Jianada', key1: 'jianada' },
        ],
    },
] as unknown as TreeNodeData[];

export const defaultKeyMaps = {
    value: 'value1',
    key: 'key1',
    label: 'label1',
    children: 'children1',
    disabled: 'disabled1',
};

export const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;
export const collapsedCls = `${optionCls}-collapsed`;
export const selectedCls = `${optionCls}-selected`;

export const getOptions = () => document.querySelectorAll(`.${optionCls}`);
export const getLevelNodes = (level: number) => document.querySelectorAll(`.${optionCls}.${optionCls}-level-${level}`);
export const getNode = (key: string) => document.querySelector(`[role="treeitem"][data-key="${key}"]`) as HTMLElement;
export const getHighlights = () => document.querySelectorAll(`.${optionCls}-highlight`);
export const getExpandIcon = (node: Element) => node.querySelector(`.${optionCls}-expand-icon`) as HTMLElement;
export const getSelected = () => document.querySelectorAll(`.${selectedCls}`);
export const getSearchWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-search-wrapper`);
export const search = (value: string) => fireEvent.update(screen.getByRole('textbox'), value);
