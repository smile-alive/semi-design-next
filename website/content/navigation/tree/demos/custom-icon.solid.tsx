import { IconMapPin } from '@fibrae/semi-icons-solid';
import { Tree, type TreeNodeData } from '@fibrae/semi-ui-solid';

const style = {
    width: '260px',
    height: '420px',
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    const treeData: TreeNodeData[] = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                },
            ],
        },
    ];
    return <Tree treeData={treeData} style={style} icon={<IconMapPin style={{ color: 'var(--semi-color-text-2)' }} />} />;
}
