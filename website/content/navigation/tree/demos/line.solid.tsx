import { createSignal } from 'solid-js';
import { Switch, Tree, type TreeNodeData } from '@fibrae/semi-ui-solid';

const treeData: TreeNodeData[] = [
    {
        label: 'parent-0',
        key: 'parent-0',
        children: [
            {
                label: 'leaf-0-0',
                key: 'leaf-0-0',
                children: [
                    {
                        label: 'leaf-0-0-0',
                        key: 'leaf-0-0-0',
                    },
                    {
                        label: 'leaf-0-0-1',
                        key: 'leaf-0-0-1',
                    },
                    {
                        label: 'leaf-0-0-2',
                        key: 'leaf-0-0-2',
                    },
                ],
            },
            {
                label: 'leaf-0-1',
                key: 'leaf-0-1',
            },
        ],
    },
    {
        label: 'parent-1',
        key: 'parent-1',
    },
];

const style = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [show, setShow] = createSignal(true);

    return (
        <>
            <div style={{ display: 'flex', 'align-items': 'center', 'column-gap': '5px', 'margin-bottom': '5px' }}>
                <strong id="tree-line-show-line">showLine </strong>
                <Switch aria-labelledby="tree-line-show-line" checked={show()} onChange={(checked) => setShow(checked)} />
            </div>
            <Tree showLine={show()} defaultExpandAll treeData={treeData} style={style} />
        </>
    );
}
