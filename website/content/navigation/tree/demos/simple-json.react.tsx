import { Tree } from '@fibrae/semi-ui-react';

const json = {
    Node1: {
        'Child Node1': '0-0-1',
        'Child Node2': '0-0-2',
    },
    Node2: '0-1',
};

const style = {
    width: 260,
    height: 420,
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    return <Tree treeDataSimpleJson={json} multiple onChange={(value) => console.log('当前所有选中项: ', value)} onSelect={(key) => console.log('当前选项: ', key)} style={style} />;
}
