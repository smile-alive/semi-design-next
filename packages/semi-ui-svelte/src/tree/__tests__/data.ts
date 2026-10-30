import { flushSync } from 'svelte';
import { fireEvent } from '@testing-library/svelte';
import { vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { TreeNodeData, TreeProps } from '../interface';

type Callback<K extends keyof TreeProps> = Extract<NonNullable<TreeProps[K]>, (...args: never[]) => unknown>;

/** A spy typed as the Tree callback prop `name` */
export const spyOn = <K extends keyof TreeProps>(_name: K) => vi.fn<Callback<K>>();

export const treeData: TreeNodeData[] = [
    {
        label: '亚洲',
        value: 'Yazhou',
        key: 'yazhou',
        children: [
            {
                label: '中国',
                value: 'Zhongguo',
                key: 'zhongguo',
                children: [
                    { label: '北京', value: 'Beijing', key: 'beijing' },
                    { label: '上海', value: 'Shanghai', key: 'shanghai' },
                ],
            },
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

export const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;
export const collapsedCls = `${optionCls}-collapsed`;
export const selectedCls = `${optionCls}-selected`;

export const getOptions = () => document.querySelectorAll(`.${optionCls}`);
export const getLevelNodes = (level: number) => document.querySelectorAll(`.${optionCls}.${optionCls}-level-${level}`);
export const getNode = (key: string) => document.querySelector(`[role="treeitem"][data-key="${key}"]`) as HTMLElement;
export const getExpandIcon = (node: Element) => node.querySelector(`.${optionCls}-expand-icon`) as HTMLElement;
export const getSelected = () => document.querySelectorAll(`.${selectedCls}`);
export const getSearchWrapper = () => document.querySelector<HTMLElement>(`.${BASE_CLASS_PREFIX}-tree-search-wrapper`);
export const getTree = () => document.querySelector('[role="tree"]') as HTMLElement;

export async function click(element: Element) {
    await fireEvent.click(element);
    flushSync();
}

export async function search(value: string) {
    const input = document.querySelector(`.${BASE_CLASS_PREFIX}-tree-search-wrapper input`) as HTMLInputElement;
    await fireEvent.input(input, { target: { value } });
    flushSync();
}

export async function press(key: string, init: KeyboardEventInit = {}) {
    await fireEvent.keyDown(getTree(), { key, ...init });
    flushSync();
}
