import { IconMapPin } from '@fibrae/semi-icons-react';
import { Tree } from '@fibrae/semi-ui-react';

const treeData = [
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

const style = {
    width: 260,
    height: 420,
    border: '1px solid var(--semi-color-border)',
};

export default function TreeDemo() {
    return <Tree treeData={treeData} style={style} icon={<IconMapPin style={{ color: 'var(--semi-color-text-2)' }} />} />;
}
