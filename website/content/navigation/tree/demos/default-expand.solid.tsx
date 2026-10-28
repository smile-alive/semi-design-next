import { createSignal } from 'solid-js';
import { Button, Tree, type TreeDataSimpleJson } from '@fibrae/semi-ui-solid';

const json: TreeDataSimpleJson = {
    Node1: {
        'Child Node1': '0-0-1',
        'Child Node2': '0-0-2',
    },
    Node2: '0-1',
};

const json2: TreeDataSimpleJson = {
    Node3: {
        'Child Node1': '0-0-1',
        'Child Node2': '0-0-2',
        'Child Node3': '0-0-3',
        'Child Node4': '0-0-4',
    },
    Node2: '0-1',
};

const style = {
    'margin-right': '20px',
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const [tree, setTree] = createSignal<TreeDataSimpleJson>(json);
    const handleClick = () => {
        setTree(json2);
    };
    return (
        <>
            <Button onClick={handleClick} style={{ 'margin-bottom': '10px' }}>
                点击更新 TreeData
            </Button>
            <div style={{ display: 'flex' }}>
                <div>
                    <span>defaultExpandAll</span>
                    <Tree defaultExpandAll treeDataSimpleJson={tree()} style={style} />
                </div>
                <div>
                    <span>expandAll</span>
                    <Tree expandAll treeDataSimpleJson={tree()} style={style} />
                </div>
            </div>
        </>
    );
}
