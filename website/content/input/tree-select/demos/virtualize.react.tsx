import { useState } from 'react';
import { TreeSelect, Button, type TreeNodeData } from '@fibrae/semi-ui-react';
export default function TreeSelectDemo() {
    const [gData, setGData] = useState<TreeNodeData[]>([]);
    const [total, setTotal] = useState(0);

    function generateData(x = 5, y = 4, z = 3, data: TreeNodeData[] = []) {
        // x: nodes per level. y: nodes with children per level. z: depth (0 is one level)
        function fill(level: number, preKey: string, nodes: TreeNodeData[]) {
            const parents: string[] = [];
            for (let i = 0; i < x; i++) {
                const key = `${preKey}-${i}`;
                nodes.push({ label: `${key}-标签`, key: `${key}-key`, value: `${key}-value` });
                if (i < y) {
                    parents.push(key);
                }
            }
            if (level < 0) {
                return;
            }
            parents.forEach((key, index) => {
                const children: TreeNodeData[] = [];
                nodes[index].children = children;
                fill(level - 1, key, children);
            });
        }
        fill(z, '0', data);

        let total = 0;
        for (let n = z + 1; n >= 0; n--) {
            total += x * y ** n;
        }
        return { gData: data, total };
    }

    function onGen() {
        const { gData, total } = generateData();
        setGData(gData);
        setTotal(total);
    }

    return (
        <div style={{ padding: '0 20px' }}>
            <Button onClick={onGen}>生成数据: </Button>
            <span>共 {total} 个节点</span>
            <br />
            <br />
            {Boolean(gData.length) && (
                <TreeSelect
                    style={{ width: 300 }}
                    treeData={gData}
                    filterTreeNode
                    showFilteredOnly
                    placeholder="Please select"
                    dropdownStyle={{
                        overflow: 'hidden',
                    }}
                    virtualize={{
                        itemSize: 28,
                        // Dropdown height 300 minus the search box and 8 * 2 padding; a set height fills the rest
                        height: 236,
                    }}
                />
            )}
        </div>
    );
}
