import { get } from 'es-toolkit/compat';
import { getPosition } from '../tree/tree-util';
import { strings, VALUE_SPLIT } from './constants';
import type { BasicCascaderData } from './foundation';

export interface KeyMapProps {
    value?: string;
    label?: string;
    disabled?: string;
    children?: string;
    isLeaf?: string;
}

/**
 * @returns whether option matches sugInput; a function filterTreeNode decides with (sugInput, target, option).
 */
export function filter(sugInput: string, option: BasicCascaderData, filterTreeNode: any, filteredPath?: string[]) {
    if (!filterTreeNode) {
        return true;
    }
    let filterFn = filterTreeNode;
    let target: string;
    if (typeof filterTreeNode === 'boolean') {
        filterFn = (targetVal: string, val: string) => {
            const input = targetVal.toLowerCase();
            return val.toLowerCase().includes(input);
        };
        // join('') keeps a searched comma from matching every path
        target = filteredPath.join('');
    } else {
        target = filteredPath.join();
    }
    return filterFn(sugInput, target, option);
}

/** One column per level of the active path: the top level, then the children of each active node that has some */
export function getColumns<T extends { key: string; data: { children?: unknown[] }; children?: T[] }>(topLevel: T[], activeKeys: Set<string>) {
    const columns: Array<{ items: T[]; level: number }> = [];
    let items: T[] | undefined = topLevel;
    while (items?.length) {
        columns.push({ items, level: columns.length });
        items = items.find((item) => activeKeys.has(item.key) && item.data.children?.length)?.children;
    }
    return columns;
}

/**
 * The labels of a search result joined by the separator, split into the runs that match the keyword and the rest. Only
 * a string label is matched, as the default filter does; any other label passes through whole.
 */
export function highlightParts<T>(searchText: T[], keyword: string, separator: string) {
    const parts: Array<{ text: string | T; match: boolean }> = [];
    const lowerKeyword = keyword.toLowerCase();
    searchText.forEach((item, index) => {
        if (typeof item === 'string' && keyword) {
            const lowerItem = item.toLowerCase();
            let from = 0;
            let at = lowerItem.indexOf(lowerKeyword);
            while (at !== -1) {
                if (at > from) {
                    parts.push({ text: item.slice(from, at), match: false });
                }
                parts.push({ text: item.slice(at, at + keyword.length), match: true });
                from = at + keyword.length;
                at = lowerItem.indexOf(lowerKeyword, from);
            }
            if (from < item.length) {
                parts.push({ text: item.slice(from), match: false });
            }
        } else {
            parts.push({ text: item, match: false });
        }
        if (index !== searchText.length - 1) {
            parts.push({ text: separator, match: false });
        }
    });
    return parts;
}

function traverseDataNodes(treeNodes: any, callback: (data: any) => void, keyMaps?: KeyMapProps) {
    const realValueName = keyMaps?.value ?? 'value';
    const realChildrenName = keyMaps?.children ?? 'children';

    const processNode = (node: any, ind?: any, parent?: any) => {
        const children = node ? node[realChildrenName] : treeNodes;
        let item: any = null;
        if (node) {
            const nodeValue = node[realValueName];
            const key = parent ? `${parent.key}${VALUE_SPLIT}${nodeValue}` : `${nodeValue}`;
            const pos = parent ? getPosition(parent.pos, ind) : `${ind}`;

            const mappedData = { ...node };
            if (keyMaps) {
                Object.entries(keyMaps).forEach(([standardKey, originalKey]) => {
                    if (typeof originalKey !== 'string') {
                        return;
                    }
                    const value = node[originalKey];
                    if (value !== undefined) {
                        mappedData[standardKey] = value;
                    }
                });
            }

            item = {
                data: mappedData,
                ind,
                key,
                pos,
                level: parent ? parent.level + 1 : 0,
                parentKey: parent ? parent.key : null,
                path: parent ? [...parent.path, key] : [key],
                valuePath: parent ? [...parent.valuePath, nodeValue] : [nodeValue],
            };

            callback(item);
        }

        if (children) {
            children.forEach((subNode: any, subIndex: any) => {
                processNode(subNode, subIndex, item);
            });
        }
    };

    processNode(null);
}

export function getKeysByValuePath(valuePath: (string | number)[][] | (string | number)[]) {
    if (valuePath?.length) {
        if (Array.isArray(valuePath[0])) {
            return valuePath.map((item) => getKeyByValuePath(item));
        } else {
            return [getKeyByValuePath(valuePath as (string | number)[])];
        }
    }
    return [];
}

export function getKeyByValuePath(valuePath: (string | number)[]) {
    return valuePath.join(VALUE_SPLIT);
}

export function getKeyByPos(pos: string, treeData: BasicCascaderData[], keyMaps?: KeyMapProps) {
    const realValueName = keyMaps?.value ?? 'value';
    const realChildrenName = keyMaps?.children ?? 'children';
    const posArr = pos.split('-').map((item) => Number(item));
    let resultData = treeData;
    const valuePath: (string | number)[] = [];
    posArr.forEach((item, index) => {
        resultData = index === 0 ? resultData[item] : resultData?.[realChildrenName]?.[item];
        valuePath.push(resultData?.[realValueName]);
    });
    return getKeyByValuePath(valuePath);
}

export function convertDataToEntities(dataNodes: BasicCascaderData[], keyMaps?: KeyMapProps) {
    const keyEntities: any = {};

    traverseDataNodes(
        dataNodes,
        (data: any) => {
            const { key, parentKey } = data;
            const entity = { ...data };

            keyEntities[key] = entity;

            entity.parent = keyEntities[parentKey];
            if (entity.parent) {
                entity.parent.children = entity.parent.children || [];
                entity.parent.children.push(entity);
            }
        },
        keyMaps
    );
    return keyEntities;
}

export function getValueOrKey(data: any, keyMaps?: KeyMapProps) {
    const valueName = keyMaps?.value ?? 'value';
    if (Array.isArray(data)) {
        return data.map((item) => get(item, valueName));
    }
    return get(data, valueName);
}

export function calcMergeType(autoMergeValue: boolean, leafOnly: boolean) {
    let mergeType: string;
    if (leafOnly) {
        mergeType = strings.LEAF_ONLY_MERGE_TYPE;
    } else if (autoMergeValue) {
        mergeType = strings.AUTO_MERGE_VALUE_MERGE_TYPE;
    } else {
        mergeType = strings.NONE_MERGE_TYPE;
    }
    return mergeType;
}
