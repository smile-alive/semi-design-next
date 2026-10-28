import { omit } from 'es-toolkit';
import { strings } from './constants';
import type { BasicDataItem, BasicGroupItem, BasicResolvedDataItem } from './foundation';

export function _generateGroupedData(dataSource: BasicGroupItem[]) {
    const newData: BasicResolvedDataItem[] = [];
    for (const { children = [], ...group } of dataSource) {
        // one _parent per group: getGroupIndexes tells groups apart by the object, as titles may repeat or be absent
        for (const item of children) {
            newData.push({ ...item, _parent: group });
        }
    }
    return newData;
}

export function _generateTreeData(dataSource: BasicDataItem[]): BasicResolvedDataItem[] {
    const newData = [];
    const stack = dataSource.toReversed();
    while (stack.length) {
        // roots are the caller's objects: copy before writing _path and _isLeaf (underscored to avoid their fields)
        const current = { ...stack.pop() };
        current._path = current._path || [omit(current, ['children'])];
        // children: [] is a leaf, as the Tree on the left renders it
        if (Array.isArray(current.children) && current.children.length > 0) {
            const nodes = current.children;
            for (let i = nodes.length - 1; i >= 0; i--) {
                const child = { ...nodes[i] };
                child._path = [].concat(current._path).concat(omit(child, ['children']));
                stack.push(child);
            }
        } else {
            current._isLeaf = true;
        }
        newData.push(omit(current, ['children']));
    }
    return newData;
}

export function _generateDataByType(dataSource: BasicDataItem[] | BasicGroupItem[], type: string): BasicResolvedDataItem[] {
    if (type === strings.TYPE_GROUP_LIST) {
        return _generateGroupedData(dataSource as BasicGroupItem[]);
    }
    if (type === strings.TYPE_TREE_TO_LIST) {
        return _generateTreeData(dataSource as BasicDataItem[]);
    }
    return (dataSource as BasicDataItem[]).slice();
}

export function _generateSelectedItems(value: unknown[], data: BasicResolvedDataItem[]): Map<BasicDataItem['key'], BasicResolvedDataItem> {
    const byValue = new Map<unknown, BasicResolvedDataItem>();
    for (const option of data) {
        if (!byValue.has(option.value)) {
            byValue.set(option.value, option);
        }
    }
    const selectedItems = new Map<BasicDataItem['key'], BasicResolvedDataItem>();
    for (const val of value) {
        const option = byValue.get(val);
        if (option) {
            selectedItems.set(option.key, option);
        }
    }
    return selectedItems;
}
