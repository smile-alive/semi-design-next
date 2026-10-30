import { flushSync } from 'svelte';
import { fireEvent } from '@testing-library/svelte';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import type { TreeNodeData } from '../../tree';

export const prefixCls = `${BASE_CLASS_PREFIX}-tree-select`;
export const treePrefixCls = `${BASE_CLASS_PREFIX}-tree`;
export const optionCls = `${BASE_CLASS_PREFIX}-tree-option`;

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

export const treeDataWithDisabledLeaf: TreeNodeData[] = [
    {
        label: 'Asia',
        value: 'Asia',
        key: '0',
        children: [
            { label: 'Beijing', value: 'Beijing', key: '0-0', disabled: true },
            { label: 'Shanghai', value: 'Shanghai', key: '0-1' },
        ],
    },
];

export const treeDataWithLoad: TreeNodeData[] = [{ label: 'Node 1', value: 'node1', key: 'node1', isLeaf: false }];

// lets the foundation's timers and the effects they schedule run
export async function settle() {
    flushSync();
    await new Promise((resolve) => setTimeout(resolve));
    flushSync();
    await Promise.resolve();
    flushSync();
}

export const getRoot = () => document.querySelector<HTMLElement>(`.${prefixCls}`) as HTMLElement;
export const getPopover = () => document.querySelector<HTMLElement>(`.${prefixCls}-popover`);
export const getRows = () => [...document.querySelectorAll<HTMLElement>(`.${optionCls}`)];
export const getRowLabels = () => getRows().map((row) => row.textContent?.trim());
export const getRow = (label: string) => getRows().find((row) => row.textContent?.trim() === label) as HTMLElement;
export const getSelection = () => document.querySelector<HTMLElement>(`.${prefixCls}-selection`) as HTMLElement;
export const getSelectionText = () => getSelection().textContent?.trim();
export const getTags = () => [...document.querySelectorAll<HTMLElement>(`.${prefixCls}-selection .${BASE_CLASS_PREFIX}-tag`)];
export const getTagTexts = () => getTags().map((tag) => tag.textContent?.trim());
export const getClearButton = () => document.querySelector<HTMLElement>(`.${prefixCls}-clearbtn`);
export const getSearchInput = () => document.querySelector<HTMLInputElement>(`.${treePrefixCls}-search-wrapper input`) as HTMLInputElement;
export const getTriggerInput = () => getRoot().querySelector('input') as HTMLInputElement;

export async function click(element: Element | null) {
    await fireEvent.click(element as Element);
    await settle();
}

export async function keyDown(target: Element, key: string) {
    await fireEvent.keyDown(target, { key });
    await settle();
}

export async function search(text: string, input: HTMLInputElement = getSearchInput()) {
    input.value = text;
    await fireEvent.input(input);
    await settle();
}
