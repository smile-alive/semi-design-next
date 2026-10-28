import { describe, expect, it } from 'vite-plus/test';
import { calcCheckedKeys, calcCheckedKeysForChecked, calcCheckedKeysForCheckedKeys, convertDataToEntities } from '../tree-util';

const sorted = (keys: Set<string>) => [...keys].sort();

const treeData = [
    {
        key: 'root',
        label: 'Root',
        children: [
            {
                key: 'g1',
                label: 'G1',
                children: [
                    { key: 'a1', label: 'A1' },
                    { key: 'a2', label: 'A2', disabled: true },
                    { key: 'a3', label: 'A3' },
                ],
            },
            {
                key: 'g2',
                label: 'G2',
                children: [
                    { key: 'b1', label: 'B1' },
                    { key: 'b2', label: 'B2' },
                ],
            },
        ],
    },
];
const { keyEntities } = convertDataToEntities(treeData);

describe('calcCheckedKeys', () => {
    it.each([
        {
            name: '一个分组的子节点全部选中时，分组选中且根节点半选',
            values: ['b1', 'b2'],
            checked: ['b1', 'b2', 'g2'],
            half: ['root'],
        },
        {
            name: '只选中部分子节点时，祖先半选',
            values: ['a1', 'b1'],
            checked: ['a1', 'b1'],
            half: ['g1', 'g2', 'root'],
        },
        {
            name: '所有叶子都选中时，一路选中到根',
            values: ['a1', 'a2', 'a3', 'b1', 'b2'],
            checked: ['a1', 'a2', 'a3', 'b1', 'b2', 'g1', 'g2', 'root'],
            half: [],
        },
        {
            name: '选中父节点时包含全部后代',
            values: 'g1',
            checked: ['a1', 'a2', 'a3', 'g1'],
            half: ['root'],
        },
        {
            name: '禁用的未选中后代不阻止其兄弟选中的结果推导',
            values: ['a1', 'a3'],
            checked: ['a1', 'a3'],
            half: ['g1', 'root'],
        },
    ])('$name', ({ values, checked, half }) => {
        const result = calcCheckedKeys(values, keyEntities);
        expect(sorted(result.checkedKeys)).toEqual(checked);
        expect(sorted(result.halfCheckedKeys)).toEqual(half);
    });

    it('2 万个已选中子节点的结果与小规模推导一致', () => {
        const size = 20000;
        const children = Array.from({ length: size }, (_, i) => ({ key: `c${i}`, label: `C${i}` }));
        const { keyEntities: bigEntities } = convertDataToEntities([{ key: 'p', label: 'P', children }]);
        const keys = children.map((child) => child.key);

        const all = calcCheckedKeys(keys, bigEntities);
        expect(all.checkedKeys.size).toBe(size + 1);
        expect(all.checkedKeys.has('p')).toBe(true);
        expect(all.halfCheckedKeys.size).toBe(0);

        const partial = calcCheckedKeys(keys.slice(1), bigEntities);
        expect(partial.checkedKeys.size).toBe(size - 1);
        expect(partial.checkedKeys.has('p')).toBe(false);
        expect([...partial.halfCheckedKeys]).toEqual(['p']);
    });
});

describe('calcCheckedKeysForCheckedKeys', () => {
    // deterministic, so a failing tree can be reproduced
    const createRandom = (seed: number) => () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };

    const buildTree = (random: () => number) => {
        let counter = 0;
        const build = (depth: number) => {
            const node: any = { key: `n${counter++}`, label: 'n' };
            if (depth < 4 && random() < 0.7) {
                node.children = Array.from({ length: 1 + Math.floor(random() * 4) }, () => build(depth + 1));
            }
            return node;
        };
        return Array.from({ length: 1 + Math.floor(random() * 3) }, () => build(0));
    };

    it('与逐个调用 calcCheckedKeysForChecked 的结果一致', () => {
        let withHalfChecked = 0;
        for (let seed = 1; seed <= 60; seed++) {
            const random = createRandom(seed);
            const { keyEntities: entities } = convertDataToEntities(buildTree(random));
            const keys = Object.keys(entities);

            let checkedKeys = new Set<string>();
            let halfCheckedKeys = new Set<string>();
            for (const key of keys.filter(() => random() < 0.25)) {
                if (!checkedKeys.has(key)) {
                    ({ checkedKeys, halfCheckedKeys } = calcCheckedKeysForChecked(key, entities, checkedKeys, halfCheckedKeys));
                }
            }
            const scope = keys.filter(() => random() < 0.3).sort(() => random() - 0.5);

            let expectedChecked = checkedKeys;
            let expectedHalf = halfCheckedKeys;
            for (const key of scope) {
                if (!expectedChecked.has(key)) {
                    ({ checkedKeys: expectedChecked, halfCheckedKeys: expectedHalf } = calcCheckedKeysForChecked(key, entities, expectedChecked, expectedHalf));
                }
            }

            const result = calcCheckedKeysForCheckedKeys(scope, entities, checkedKeys, halfCheckedKeys);
            expect(sorted(result.checkedKeys), `seed ${seed} checked`).toEqual(sorted(expectedChecked));
            expect(sorted(result.halfCheckedKeys), `seed ${seed} half`).toEqual(sorted(expectedHalf));
            withHalfChecked += result.halfCheckedKeys.size > 0 ? 1 : 0;
        }
        expect(withHalfChecked).toBeGreaterThan(10);
    });

    it('不修改传入的集合', () => {
        const checked = new Set(['a1']);
        const half = new Set(['g1', 'root']);
        calcCheckedKeysForCheckedKeys(['b1', 'b2'], keyEntities, checked, half);
        expect([...checked]).toEqual(['a1']);
        expect([...half]).toEqual(['g1', 'root']);
    });
});
