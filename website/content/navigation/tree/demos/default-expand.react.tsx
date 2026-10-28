import { useState } from 'react';
import { Tree, Button, type TreeProps } from '@fibrae/semi-ui-react';

export default function TreeDemo() {
    const json = {
        Node1: {
            'Child Node1': '0-0-1',
            'Child Node2': '0-0-2',
        },
        Node2: '0-1',
    };
    const json2 = {
        Node3: {
            'Child Node1': '0-0-1',
            'Child Node2': '0-0-2',
            'Child Node3': '0-0-3',
            'Child Node4': '0-0-4',
        },
        Node2: '0-1',
    };
    const style = {
        marginRight: 20,
        width: 260,
        height: 420,
        border: '1px solid var(--semi-color-border)',
    };
    const [tree, setTree] = useState<TreeProps['treeDataSimpleJson']>(json);
    const handleClick = () => {
        setTree(json2);
    };
    return (
        <>
            <Button onClick={handleClick} style={{ marginBottom: 10 }}>
                点击更新 TreeData
            </Button>
            <div style={{ display: 'flex' }}>
                <div>
                    <span>defaultExpandAll</span>
                    <Tree defaultExpandAll treeDataSimpleJson={tree} style={style} />
                </div>
                <div>
                    <span>expandAll</span>
                    <Tree expandAll treeDataSimpleJson={tree} style={style} />
                </div>
            </div>
        </>
    );
}
