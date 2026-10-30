import { createSignal, Show } from 'solid-js';
import { Button, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-solid';

// x: nodes per level. y: nodes with children per level. z: depth (0 is one level)
function generateData(x = 5, y = 4, z = 3) {
    const data: TreeNodeData[] = [];

    const fill = (level: number, preKey: string, nodes: TreeNodeData[]) => {
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
    };
    fill(z, '0', data);

    let total = 0;
    for (let n = z + 1; n >= 0; n--) {
        total += x * y ** n;
    }
    return { gData: data, total };
}

export default function TreeSelectDemo() {
    const [gData, setGData] = createSignal<TreeNodeData[]>([]);
    const [total, setTotal] = createSignal(0);

    const onGen = () => {
        const generated = generateData();
        setGData(generated.gData);
        setTotal(generated.total);
    };

    return (
        <div style={{ padding: '0 20px' }}>
            <Button onClick={onGen}>生成数据: </Button>
            <span>共 {total()} 个节点</span>
            <br />
            <br />
            <Show when={gData().length > 0}>
                <TreeSelect
                    style={{ width: '300px' }}
                    treeData={gData()}
                    filterTreeNode
                    showFilteredOnly
                    placeholder="Please select"
                    dropdownStyle={{ overflow: 'hidden' }}
                    virtualize={{
                        itemSize: 28,
                        // Dropdown height 300 minus the search box and 8 * 2 padding; a set height fills the rest
                        height: 236,
                    }}
                />
            </Show>
        </div>
    );
}
