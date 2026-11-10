/**
 * Part of the utils function implementation process reference
 * https://github.com/react-component/tree/blob/master/src/util.tsx
 */

import { difference, uniq, omit } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import { isObject } from '../../utils/index';
import { strings } from './constants';
import type { BasicFlattenNode, BasicKeyEntities, BasicKeyEntity, BasicTreeNodeData, BasicTreeNodeProps, BasicValue } from './foundation';

interface TreeDataSimpleJson {
    [x: string]: string | TreeDataSimpleJson;
}

export interface NodeData {
    key: string;
    label: string;
    value: any;
    children?: NodeData[];
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

export function flattenTreeData(treeNodeList: BasicTreeNodeData[], expandedKeys: Set<string>, keyMaps: KeyMapProps, filteredShownKeys: boolean | Set<string> = false) {
    const flattenList: BasicFlattenNode[] = [];
    const filterSearch = Boolean(filteredShownKeys);
    const realKeyName = keyMaps?.key ?? 'key';
    const realChildrenName = keyMaps?.children ?? 'children';
    if (treeNodeList === undefined) {
        return [];
    }
    const flatten = (list: BasicTreeNodeData[], parent: BasicFlattenNode = null) => {
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

            const flattenNode: BasicFlattenNode = {
                // `in` also reads inherited properties, such as getters of class-based tree data
                ...Object.fromEntries(['key', 'label', 'value', 'icon', 'disabled', 'isLeaf'].filter((name) => name in treeNode).map((name) => [name, treeNode[name]])),
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
    const treeData: NodeData[] = [];
    const traverseNode = (key: string, children: string | TreeDataSimpleJson, path: string[], res: NodeData[]) => {
        const currPath = [...path, key];
        const itemKey = currPath.join(strings.JSON_KEY_SPLIT);

        const newNode: NodeData = {
            key: itemKey,
            label: key,
            value: children,
        };
        if (isObject(children)) {
            const newChildren: NodeData[] = [];
            Object.entries(children).forEach((c) => {
                traverseNode(c[0], c[1], currPath, newChildren);
            });
            newNode.children = newChildren;
        }
        res.push(newNode);
    };
    Object.entries(treeJson ?? {}).forEach((item) => traverseNode(item[0], item[1], [], treeData));
    return treeData;
}

export interface TraversedNode {
    data: BasicTreeNodeData;
    ind: number;
    pos: string;
    key: string;
    parentPos: string | null;
    level: number;
}

interface TraverseParent {
    node: BasicTreeNodeData;
    pos: string;
    level: number;
}

export function traverseDataNodes(treeNodes: BasicTreeNodeData[], callback: (data: TraversedNode) => void, keyMaps: KeyMapProps) {
    const realKeyName = keyMaps?.key ?? 'key';
    const realChildrenName = keyMaps?.children ?? 'children';
    const processNode = (node: BasicTreeNodeData, ind?: number, parent?: TraverseParent) => {
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
            children.forEach((subNode: BasicTreeNodeData, subIndex: number) => {
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

export function convertDataToEntities(dataNodes: BasicTreeNodeData[], keyMaps?: KeyMapProps) {
    const posEntities: BasicKeyEntities = {};
    const keyEntities: BasicKeyEntities = {};
    const valueEntities: Record<string, string> = {};
    const wrapper = {
        posEntities,
        keyEntities,
        valueEntities,
    };
    const realValueName = keyMaps?.value ?? 'value';

    traverseDataNodes(
        dataNodes,
        (data) => {
            const { pos, key, parentPos } = data;
            const entity: BasicKeyEntity = { ...data };
            const value = get(entity, `data.${realValueName}`, null);

            if (value !== null) {
                valueEntities[value] = key;
            }

            posEntities[pos] = entity;
            keyEntities[key] = entity;

            entity.parent = posEntities[parentPos];
            if (entity.parent) {
                entity.parent.children ||= [];
                entity.parent.children.push(entity);
            }
        },
        keyMaps
    );

    return wrapper;
}

export function findKeysForValues(valueList: any, valueEntities: Record<string, string>, isMultiple = false) {
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

    const res: string[] = [];
    valueList.forEach((val: string) => {
        if (val in valueEntities) {
            res.push(valueEntities[val]);
        } else if (val) {
            res.push(val);
        }
    });

    return res;
}

export function findDescendantKeys(selectedKeys: string[], options: BasicKeyEntities, self = true) {
    const res: string[] = [];
    const findChild = (item: BasicKeyEntity) => {
        if (!item) {
            return;
        }
        const { children } = item;
        const hasChildren = children != null;
        if (hasChildren) {
            children.forEach((child) => {
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

export function findChildKeys(keys: string[], options: BasicKeyEntities, omitKeys: string[] = []) {
    const res: string[] = [];
    if (keys) {
        keys.forEach((key) => {
            const opts = options[key];
            if (opts && opts.children) {
                opts.children.forEach((child) => {
                    if (!omitKeys.length || !omitKeys.includes(child.key)) {
                        res.push(child.key);
                    }
                });
            }
        });
    }
    return res;
}

export function findSiblingKeys(selectedKeys: string[], options: BasicKeyEntities, self = true) {
    const par: string[] = [];
    selectedKeys.forEach((item) => {
        if (options[item] && options[item].parent) {
            par.push(options[item].parent.key);
        }
    });

    const res = findChildKeys(uniq(par), options, self ? [] : selectedKeys);
    return res;
}

export function findAncestorKeys(selectedKeys: string[], options: BasicKeyEntities, self = true) {
    const res: string[] = [];
    const findPar = (item: BasicKeyEntity) => {
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

function getSortedKeyList(keyList: string[], keyEntities: BasicKeyEntities) {
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

export function calcCheckedKeys(values: string | string[], keyEntities: BasicKeyEntities) {
    const keyList = Array.isArray(values) ? values : [values];
    const descendantKeys = findDescendantKeys(keyList, keyEntities, true);
    const checkedKeys = new Set(descendantKeys);
    const halfCheckedKeys = new Set<string>();
    const visited = new Set<string>();

    const levelMap: { [key: number]: string[] } = getSortedKeyList(keyList, keyEntities);

    const calcCurrLevel = ({ key, parent, level }: BasicKeyEntity) => {
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

export function calcExpandedKeys(keyList: string[] = [], keyEntities: BasicKeyEntities, autoExpandParent = true) {
    if (!Array.isArray(keyList)) {
        keyList = [keyList];
    }
    if (autoExpandParent) {
        const ancestorKeys = findAncestorKeys(keyList, keyEntities, true);
        return new Set(ancestorKeys);
    }
    return new Set(keyList);
}

export function calcExpandedKeysForValues(value: any, keyEntities: BasicKeyEntities, isMultiple: boolean, valueEntities: Record<string, string>) {
    const keys = findKeysForValues(value, valueEntities, isMultiple);
    return new Set(findAncestorKeys(keys, keyEntities, false));
}

export function calcMotionKeys(oldKeySet: Set<string>, newKeySet: Set<string>, keyEntities: BasicKeyEntities) {
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

export function matchTreeNode(searchValue: string, option: BasicTreeNodeData, filterTreeNode: any, filterProps: string) {
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

export function normalizeKeyList(keyList: string[] | Set<string>, keyEntities: BasicKeyEntities, leafOnly = false, keepUnknownKeys?: boolean) {
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

export function getMotionKeys(eventKey: string, expandedKeys: Set<string>, keyEntities: BasicKeyEntities) {
    const res: string[] = [];

    const getChild = (itemKey: string) => {
        if (keyEntities[itemKey].children) {
            keyEntities[itemKey].children.forEach(({ key }) => {
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

export function calcCheckedKeysForChecked(key: string, keyEntities: BasicKeyEntities, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
    const descendantKeys = findDescendantKeys([key], keyEntities, true);
    const nodeItem = keyEntities[key];
    checkedKeys = new Set([...checkedKeys, key]);
    halfCheckedKeys = new Set(halfCheckedKeys);
    halfCheckedKeys.delete(key);
    descendantKeys.forEach((descendantKey) => halfCheckedKeys.delete(descendantKey));
    const calcCurrLevel = (node: BasicKeyEntity) => {
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
export function calcCheckedKeysForCheckedKeys(keys: string[], keyEntities: BasicKeyEntities, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
    const checked = new Set(checkedKeys);
    const half = new Set(halfCheckedKeys);
    const parentsByLevel = new Map<number, Set<BasicKeyEntity>>();
    const markChecked = (key: string) => {
        checked.add(key);
        half.delete(key);
    };
    const enqueueParent = ({ parent }: BasicKeyEntity) => {
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
            if (parent.children.every((child) => checked.has(child.key))) {
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

export function calcCheckedKeysForUnchecked(key: string, keyEntities: BasicKeyEntities, checkedKeys: Set<string>, halfCheckedKeys: Set<string>) {
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
    const calcCurrLevel = (node: BasicKeyEntity) => {
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
        .filter((item) => matchTreeNode(inputValue, item.data, filterTreeNode, filterProps))
        .map((item) => item.key);
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

export function calcDisabledKeys(keyEntities: BasicKeyEntities, keyMaps?: KeyMapProps) {
    const disabledName = keyMaps?.disabled ?? 'disabled';
    const disabledKeys = Object.keys(keyEntities).filter((key) => keyEntities[key].data[disabledName]);
    const { checkedKeys } = calcCheckedKeys(disabledKeys, keyEntities);
    return checkedKeys;
}

export function calcDropRelativePosition({ clientY }: { clientY: number }, treeNode: BasicTreeNodeProps) {
    const { top, bottom, height } = treeNode.nodeInstance.getBoundingClientRect();
    if (clientY <= top + height * DRAG_OFFSET) {
        return -1;
    }
    if (clientY >= bottom - height * DRAG_OFFSET) {
        return 1;
    }

    return 0;
}

export function getDragNodesKeys(key: string, keyEntities: BasicKeyEntities) {
    return findDescendantKeys([key], keyEntities, true);
}

export function calcDropActualPosition(pos: string, relativeDropPos: number) {
    const posArr = pos.split('-');
    return relativeDropPos + Number(posArr.at(-1));
}
