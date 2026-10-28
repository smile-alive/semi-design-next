import { IconMapPin } from '@fibrae/semi-icons-react';
import { Tree } from '@fibrae/semi-ui-react';

export default function TreeDemo() {
    const treeData = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            icon: <IconMapPin style={{ color: 'var(--semi-color-text-2)' }} />,
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                    icon: <IconMapPin style={{ color: 'var(--semi-color-text-2)' }} />,
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    icon: <IconMapPin style={{ color: 'var(--semi-color-text-2)' }} />,
                },
            ],
        },
    ];
    const style = {
        width: 260,
        height: 420,
        border: '1px solid var(--semi-color-border)',
    };
    return <Tree treeData={treeData} style={style} />;
}
