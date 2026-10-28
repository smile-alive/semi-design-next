/**
 * Part of the utils function implementation process reference
 * https://github.com/react-component/tree/blob/master/src/util.tsx
 */

import { difference, uniq, omit } from 'es-toolkit';
// compat pick also reads inherited properties (e.g. getters)
import { get, pick } from 'es-toolkit/compat';
import isObject from '../utils/is-object';
import { strings } from './constants';
import type { BasicKeyEntities, BasicTreeNodeData, BasicTreeNodeProps, BasicValue } from './foundation';

export interface KeyEntities {
    [x: string]: any;
}

export interface TreeDataSimpleJson {
    [x: string]: string | TreeDataSimpleJson;
}

export interface NodeData {
    key: any;
    label: any;
    value: any;
    children?: any;
}

export interface KeyMapProps {
    key?: string;
    label?: string;
    value?: string;
    disabled?: string;
    children?: string;
    isLeaf?: string;
    icon?: string;
}

const DRAG_OFFSET = 0.45;

export function getPosition(parentPos: string, index: number) {
    return `${parentPos}-${index}`;
}

/** Flattens nested tree data into a list, as the virtual list renders it. */
export function flattenTreeData(treeNodeList: any[], expandedKeys: Set<string>, keyMaps: KeyMapProps, filteredShownKeys: boolean | Set<any> = false) {
    const flattenList: any[] = [];
    const filterSearch = Boolean(filteredShownKeys);
    const realKeyName = keyMaps?.key ?? 'key';
    const realChildrenName = keyMaps?.children ?? 'children';
    if (treeNodeList === undefined) {
        return [];
    }
    const flatten = (list: any[], parent: any = null) => {
        return list.map((treeNode, index) => {
            const pos = getPosition(parent ? parent.pos : '0', index);
            const mergedKey = treeNode[realKeyName];
            const otherData = {};
            if (keyMaps) {
                Object.entries(omit(keyMaps, ['children'])).forEach(([key, value]) => {
                    const result = treeNode[value];
                    if (result !== undefined) {
                        otherData[key] = result;
                    }
                });
            }

            const flattenNode: any = {
                ...pick(treeNode, ['key', 'label', 'value', 'icon', 'disabled', 'isLeaf']),
                ...otherData,
                parent,
                pos,
                children: null,
                data: treeNode,
                _innerDataTag: true,
                isEnd: [...(parent ? parent.isEnd : []), index === list.length - 1],
            };
            const isBooleanFilteredShownKeys = typeof filteredShownKeys === 'boolean';
            if (!filterSearch || (!isBooleanFilteredShownKeys && filteredShownKeys.has(mergedKey))) {
                flattenList.push(flattenNode);
            }

            if (expandedKeys.has(mergedKey) && (!filterSearch || (!isBooleanFilteredShownKeys && filteredShownKeys.has(mergedKey)))) {
                flattenNode.children = flatten(treeNode[realChildrenName] || [], flattenNode);
            } else {
                flattenNode.children = [];
            }

            return flattenNode;
        });
    };
    flatten(treeNodeList);
    return flattenList;
}

export function convertJsonToData(treeJson: TreeDataSimpleJson) {
    const treeData: any[] = [];
    const traverseNode = (key: string, children: any, path: any, res: any[]) => {
        const currPath = [...path, key];
        const itemKey = currPath.join(strings.JSON_KEY_SPLIT);

        const newNode: NodeData = {
            key: itemKey,
            label: key,
            value: children,
        };
        if (isObject(children)) {
            const newChildren: any[] = [];
            Object.entries(children).forEach((c) => {
                traverseNode(c[0], c[1], currPath, newChildren);
            });
            newNode.children = newChildren;
        }
        res.push(newNode);
    };
    Object.entries(treeJson).forEach((item) => traverseNode(item[0], item[1], [], treeData));
    return treeData;
}

export interface TraversedNode {
    data: any;
    ind: number;
    pos: string;
    key: any;
    parentPos: any;
    level: number;
}

interface TraverseParent {
    node: any;
    pos: string;
    level: number;
}

export function traverseDataNodes(treeNodes: any[], callback: (data: TraversedNode) => void, keyMaps: KeyMapProps) {
    const realKeyName = keyMaps?.key ?? 'key';
    const realChildrenName = keyMaps?.children ?? 'children';
    const processNode = (node: any, ind?: number, parent?: TraverseParent) => {
        const children = node ? node[realChildrenName] : treeNodes;
        const pos = node ? getPosition(parent.pos, ind) : '0';
        if (node) {
            const nodeKey = get(node, realKeyName, null);
            const data = {
                data: { ...node },
                ind,
                pos,
                key: nodeKey !== null ? nodeKey : pos,
                parentPos: parent.node ? parent.pos : null,
                level: Number(parent.level) + 1,
            };
            callback(data);
        }
        if (children) {
            children.forEach((subNode: any, subIndex: number) => {
                processNode(subNode, subIndex, {
                    node,
                    pos,
                    level: parent ? Number(parent.level) + 1 : -1,
                });
            });
        }
    };

    processNode(null);
}

export function convertDataToEntities(dataNodes: any[], keyMaps?: KeyMapProps) {
    const posEntities = {};
    const keyEntities = {};
    const valueEntities = {};
    const wrapper = {
        posEntities,
        keyEntities,
        valueEntities,
    };
    const realValueName = keyMaps?.value ?? 'value';

    traverseDataNodes(
        dataNodes,
        (data: any) => {
            const { pos, key, parentPos } = data;
            const entity = { ...data };
            const value = get(entity, `data.${realValueName}`, null);

            if (value !== null) {
                valueEntities[value] = key;
            }

            posEntities[pos] = entity;
            keyEntities[key] = entity;

            entity.parent = posEntities[parentPos];
            if (entity.parent) {
                entity.parent.children = entity.parent.children || [];
                entity.parent.children.push(entity);
            }
        },
        keyMaps
    );

    return wrapper;
}

export function findKeysForValues(valueList: any, valueEntities: any, isMultiple = false) {
    if (valueList == null) {
        return [];
    }
    if (!isMultiple && Array.isArray(valueList)) {
        valueList = valueList.length ? [valueList[0]] : [];
    } else if (!Array.isArray(valueList)) {
        valueList = [valueList];
    }

    if (!valueEntities || Object.keys(valueEntities).length === 0) {
        return valueList;
    }

    const res: any[] = [];
    valueList.forEach((val: string) => {
        if (val in valueEntities) {
            res.push(valueEntities[val]);
        } else if (val) {
            res.push(val);
        }
    });

    return res;
}

export function findDescendantKeys(selectedKeys: string[], options: KeyEntities, self = true) {
    const res: string[] = [];
    const findChild = (item: any) => {
        if (!item) {
            return;
        }
        const { children } = item;
        const hasChildren = children != null;
        if (hasChildren) {
            children.forEach((child: any) => {
                res.push(child.key);
                findChild(options[child.key]);
            });
        }
    };
    selectedKeys.forEach((item) => {
        if (self) {
            res.push(item);
        }
        findChild(options[item]);
    });
    return res;
}

export function findChildKeys(keys: string[], options: KeyEntities, omitKeys: any[] = []) {
    const res: any[] = [];
    if (keys) {
        keys.forEach((key) => {
            const opts = options[key];
            if (opts && opts.children) {
                opts.children.forEach((child: any) => {
                    if (!omitKeys.length || !omitKeys.includes(child.key)) {
                        res.push(child.key);
                    }
                });
            }
        });
    }
    return res;
}

export function findSiblingKeys(selectedKeys: string[], options: KeyEntities, self = true) {
    const par: any[] = [];
    selectedKeys.forEach((item) => {
        if (options[item] && options[item].parent) {
            par.push(options[item].parent.key);
        }
    });

    const res = findChildKeys(uniq(par), options, self ? [] : selectedKeys);
    return res;
}

export function findAncestorKeys(selectedKeys: string[], options: KeyEntities, self = true) {
    const res: any[] = [];
    const findPar = (item: any) => {
        if (item.parent) {
            res.push(item.parent.key);
            findPar(item.parent);
        }
    };
    selectedKeys.forEach((item) => {
        if (options[item]) {
            findPar(options[item]);
        }
        if (self) {
            res.push(item);
        }
    });
    return res;
}

function getSortedKeyList(keyList: any[], keyEntities: KeyEntities) {
    const levelMap = {};
    keyList.forEach((key) => {
        if (!keyEntities[key]) {
            return;
        }
        const { level } = keyEntities[key];
        if (levelMap[level]) {
            levelMap[level].push(key);
        } else {
            levelMap[level] = [key];
        }
    });
    return levelMap;
}

export function calcCheckedKeys(values: any, keyEntities: KeyEntities) {
    const keyList = Array.isArray(values) ? values : [values];
    const descendantKeys = findDescendantKeys(keyList, keyEntities, true);
    const checkedKeys = new Set(descendantKeys);
    const halfCheckedKeys = new Set<string>();
    const visited = new Set<string>();

    const levelMap: { [key: number]: string[] } = getSortedKeyList(keyList, keyEntities);

    const calcCurrLevel = ({ key, parent, level }: any) => {
        if (!parent || visited.has(key)) {
            return;
        }

        const siblingKeys = findSiblingKeys([key], keyEntities);
        siblingKeys.forEach((siblingKey: string) => visited.add(siblingKey));
        const allChecked = siblingKeys.every((siblingKey: string) => checkedKeys.has(siblingKey));
        if (!allChecked) {
            findAncestorKeys([key], keyEntities, false).forEach((ancestorKey: string) => halfCheckedKeys.add(ancestorKey));
        } else {
            checkedKeys.add(parent.key);
            // the parent level may not exist in levelMap yet
            if (level - 1 in levelMap && level) {
                levelMap[level - 1].push(parent.key);
            } else {
                levelMap[level - 1] = [parent.key];
            }
        }
    };
    while (Object.keys(levelMap).length > 0) {
        const maxLevel = Math.max(...Object.keys(levelMap).map((key) => Number(key)));
        levelMap[maxLevel].forEach((key: string) => calcCurrLevel(keyEntities[key]));
        delete levelMap[maxLevel];
    }

    return {
        checkedKeys,
        halfCheckedKeys,
    };
}

export function calcExpandedKeys(keyList: any[] = [], keyEntities: KeyEntities, autoExpandParent = true) {
    if (!Array.isArray(keyList)) {
        keyList = [keyList];
    }
    if (autoExpandParent) {
        const ancestorKeys = findAncestorKeys(keyList, keyEntities, true);
        return new Set(ancestorKeys);
    }
    return new Set(keyList);
}

export function calcExpandedKeysForValues(value: any, keyEntities: KeyEntities, isMultiple: boolean, valueEntities: Record<string, string>) {
    const keys = findKeysForValues(value, valueEntities, isMultiple);
    return new Set(findAncestorKeys(keys, keyEntities, false));
}

export function calcMotionKeys(oldKeySet: Set<string>, newKeySet: Set<string>, keyEntities: KeyEntities) {
    let motionType: 'show' | 'hide' = 'show';
    const oldKeys = [...oldKeySet];
    const newKeys = [...newKeySet];

    if (Math.abs(oldKeys.length - newKeys.length) !== 1) {
        return { motionType, motionKeys: [] };
    }

    let diffKeys = [];
    if (oldKeys.length > newKeys.length) {
        motionType = 'hide';
        diffKeys = difference(oldKeys, newKeys);
    } else {
        diffKeys = difference(newKeys, oldKeys);
    }

    return {
        motionType: diffKeys.length === 1 ? motionType : 'show',
        motionKeys: diffKeys.length === 1 ? findDescendantKeys(diffKeys, keyEntities, false) : [],
    };
}
/**
 * @returns whether option includes searchValue.
 * When filterTreeNode is a function,returns the result of filterTreeNode which called with (searchValue, target, option).
 */
export function matchTreeNode(searchValue: string, option: any, filterTreeNode: any, filterProps: any) {
    if (!filterTreeNode) {
        return true;
    }
    let filterFn = filterTreeNode;
    let target = option;
    if (typeof filterTreeNode === 'boolean') {
        // only text is matched: an element label would match as "[object Object]"
        filterFn = (targetVal: string, val: unknown) => (typeof val === 'string' || typeof val === 'number') && String(val).toLowerCase().includes(targetVal.toLowerCase());
    }
    if (filterProps) {
        target = option[filterProps];
    }
    return filterFn(searchValue, target, option);
}

/** The node field a search keyword is matched against: the default 'label' follows keyMaps.label. */
export function getFilterProp(treeNodeFilterProp: string, keyMaps?: KeyMapProps) {
    return treeNodeFilterProp !== 'label' ? treeNodeFilterProp : (keyMaps?.label ?? 'label');
}

export function normalizedArr(val: any) {
    if (!Array.isArray(val)) {
        return [val];
    } else {
        return val;
    }
}

export function normalizeKeyList(keyList: any, keyEntities: KeyEntities, leafOnly = false, keepUnknownKeys?: boolean) {
    const res: string[] = [];
    const keyListSet = new Set(keyList);
    if (!leafOnly) {
        keyList.forEach((key: string) => {
            if (!keyEntities[key]) {
                if (keepUnknownKeys) {
                    res.push(key);
                }
                return;
            }
            const { parent } = keyEntities[key];
            if (parent && keyListSet.has(parent.key)) {
                return;
            }
            res.push(key);
        });
    } else {
        keyList.forEach((key) => {
            if (keyEntities[key] && keyEntities[key].children == null) {
                res.push(key);
            }
            if (!keyEntities[key] && keepUnknownKeys) {
                res.push(key);
            }
        });
    }
    return res;
}

export function getMotionKeys(eventKey: string, expandedKeys: Set<string>, keyEntities: KeyEntities) {
    const res: any[] = [];

    const getChild = (itemKey: string) => {
        if (keyEntities[itemKey].children) {
            keyEntities[itemKey].children.forEach(({ key }: any) => {
                res.push(key);
                if (expandedKeys.has(key)) {
                    getChild(key);
                }
            });
        }
    };
    getChild(eventKey);
    return res;
}

export function calcCheckedKeysForChecked(key: string, keyEntities: KeyEntities, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
    const descendantKeys = findDescendantKeys([key], keyEntities, true);
    const nodeItem = keyEntities[key];
    checkedKeys = new Set([...checkedKeys, key]);
    halfCheckedKeys = new Set(halfCheckedKeys);
    halfCheckedKeys.delete(key);
    descendantKeys.forEach((descendantKey) => halfCheckedKeys.delete(descendantKey));
    const calcCurrLevel = (node: any) => {
        if (!node.parent) {
            return;
        }
        const { key } = node;
        const siblingKeys = findSiblingKeys([key], keyEntities);
        const allChecked = siblingKeys.every((key) => checkedKeys.has(key));
        if (!allChecked) {
            const ancestorKeys = findAncestorKeys([key], keyEntities, false);
            halfCheckedKeys = new Set([...halfCheckedKeys, ...ancestorKeys]);
        } else {
            const par = node.parent;
            checkedKeys.add(par.key);
            halfCheckedKeys.delete(par.key);
            calcCurrLevel(par);
        }
    };
    calcCurrLevel(nodeItem);
    return {
        checkedKeys: new Set([...checkedKeys, ...descendantKeys]),
        halfCheckedKeys,
    };
}

/**
 * Same result as applying `calcCheckedKeysForChecked` to each key in turn, but every ancestor is resolved once,
 * bottom up, instead of once per key, which keeps selecting all rows linear in the number of nodes
 */
export function calcCheckedKeysForCheckedKeys(keys: string[], keyEntities: KeyEntities, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
    const checked = new Set(checkedKeys);
    const half = new Set(halfCheckedKeys);
    const parentsByLevel = new Map<number, Set<any>>();
    const markChecked = (key: string) => {
        checked.add(key);
        half.delete(key);
    };
    const enqueueParent = ({ parent }: any) => {
        if (!parent) {
            return;
        }
        if (!parentsByLevel.has(parent.level)) {
            parentsByLevel.set(parent.level, new Set());
        }
        parentsByLevel.get(parent.level).add(parent);
    };

    for (const key of keys) {
        if (checked.has(key) || !keyEntities[key]) {
            continue;
        }
        findDescendantKeys([key], keyEntities, true).forEach(markChecked);
        enqueueParent(keyEntities[key]);
    }

    while (parentsByLevel.size > 0) {
        const level = Math.max(...parentsByLevel.keys());
        for (const parent of parentsByLevel.get(level)) {
            if (parent.children.every((child: any) => checked.has(child.key))) {
                markChecked(parent.key);
                enqueueParent(parent);
            } else {
                half.add(parent.key);
                findAncestorKeys([parent.key], keyEntities, false).forEach((ancestorKey) => half.add(ancestorKey));
            }
        }
        parentsByLevel.delete(level);
    }

    return { checkedKeys: checked, halfCheckedKeys: half };
}

export function calcCheckedKeysForUnchecked(key: string, keyEntities: KeyEntities, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
    const descendantKeys = findDescendantKeys([key], keyEntities, true);
    const nodeItem = keyEntities[key];
    descendantKeys.forEach((descendantKey) => {
        if (checkedKeys.has(descendantKey)) {
            checkedKeys.delete(descendantKey);
        }
        if (halfCheckedKeys.has(descendantKey)) {
            halfCheckedKeys.delete(descendantKey);
        }
    });
    const calcCurrLevel = (node: any) => {
        const par = node.parent;
        if (!par) {
            return;
        }
        if (!checkedKeys.has(par.key) && !halfCheckedKeys.has(par.key)) {
            return;
        }
        const { key } = node;
        const siblingKeys = findSiblingKeys([key], keyEntities);
        const anyChecked = siblingKeys.some((key) => checkedKeys.has(key) || halfCheckedKeys.has(key));
        const ancestorKeys = findAncestorKeys([key], keyEntities, false);
        if (anyChecked) {
            ancestorKeys.forEach((itemKey) => {
                if (checkedKeys.has(itemKey)) {
                    checkedKeys.delete(itemKey);
                    halfCheckedKeys.add(itemKey);
                }
            });
        } else {
            if (checkedKeys.has(par.key)) {
                checkedKeys.delete(par.key);
            }
            if (halfCheckedKeys.has(par.key)) {
                halfCheckedKeys.delete(par.key);
            }
            calcCurrLevel(par);
        }
    };
    if (nodeItem) {
        calcCurrLevel(nodeItem);
    }
    return {
        checkedKeys,
        halfCheckedKeys,
    };
}

export function filterTreeData({
    showFilteredOnly,
    keyEntities,
    inputValue,
    treeData,
    filterTreeNode,
    filterProps,
    prevExpandedKeys,
    prevFilteredKeys,
    keyMaps,
}: {
    treeData: BasicTreeNodeData[];
    inputValue: string;
    filterTreeNode: boolean | ((inputValue: string, treeNodeString: string, data?: BasicTreeNodeData) => boolean);
    filterProps: string;
    showFilteredOnly: boolean;
    keyEntities: BasicKeyEntities;
    prevExpandedKeys: string[];
    /** The matches of the previous pass over the same structure: only new matches expand their ancestors */
    prevFilteredKeys?: Set<string>;
    keyMaps: KeyMapProps;
}) {
    let filteredOptsKeys = [];
    filteredOptsKeys = Object.values(keyEntities)
        .filter((item: any) => matchTreeNode(inputValue, item.data, filterTreeNode, filterProps))
        .map((item: any) => item.key);
    const ancestorKeys = findAncestorKeys(filteredOptsKeys, keyEntities, false);
    let expandedOptsKeys = prevFilteredKeys
        ? findAncestorKeys(
              filteredOptsKeys.filter((key) => !prevFilteredKeys.has(key)),
              keyEntities,
              false
          )
        : ancestorKeys;
    if (prevExpandedKeys.length) {
        const prevExpandedValidKeys = prevExpandedKeys.filter((key: string) => Boolean(keyEntities[key]));
        expandedOptsKeys = expandedOptsKeys.concat(prevExpandedValidKeys);
    }
    const shownChildKeys = findDescendantKeys(filteredOptsKeys, keyEntities, true);
    const filteredShownKeys = new Set([...shownChildKeys, ...ancestorKeys, ...expandedOptsKeys]);
    const flattenNodes = flattenTreeData(treeData, new Set(expandedOptsKeys), keyMaps, showFilteredOnly && filteredShownKeys);

    return {
        flattenNodes,
        filteredKeys: new Set(filteredOptsKeys),
        filteredExpandedKeys: new Set(expandedOptsKeys),
        filteredShownKeys,
    };
}

export function getValueOrKey(data: any, keyMaps?: KeyMapProps) {
    const valueName = keyMaps?.value ?? 'value';
    const keyName = keyMaps?.key ?? 'key';
    if (Array.isArray(data)) {
        return data.map((item) => get(item, valueName, item[keyName]));
    }
    return get(data, valueName, data[keyName]);
}

export function normalizeValue(value: BasicValue, withObject: boolean, keyMaps?: KeyMapProps) {
    if (withObject && value != null) {
        return getValueOrKey(value, keyMaps);
    } else {
        return value;
    }
}

export function keepExistingKeys(keySet: Set<string> | string[], keyEntities: KeyEntities) {
    const keyArr = [...keySet];
    return keyArr.filter((key) => key in keyEntities);
}

export function calcDisabledKeys(keyEntities: KeyEntities, keyMaps?: KeyMapProps) {
    const disabledName = keyMaps?.disabled ?? 'disabled';
    const disabledKeys = Object.keys(keyEntities).filter((key) => keyEntities[key].data[disabledName]);
    const { checkedKeys } = calcCheckedKeys(disabledKeys, keyEntities);
    return checkedKeys;
}

export function calcDropRelativePosition({ clientY }: any, treeNode: BasicTreeNodeProps) {
    const { top, bottom, height } = treeNode.nodeInstance.getBoundingClientRect();
    if (clientY <= top + height * DRAG_OFFSET) {
        return -1;
    }
    if (clientY >= bottom - height * DRAG_OFFSET) {
        return 1;
    }

    return 0;
}

export function getDragNodesKeys(key: string, keyEntities: KeyEntities) {
    return findDescendantKeys([key], keyEntities, true);
}

export function calcDropActualPosition(pos: string, relativeDropPos: number) {
    const posArr = pos.split('-');
    return relativeDropPos + Number(posArr.at(-1));
}
