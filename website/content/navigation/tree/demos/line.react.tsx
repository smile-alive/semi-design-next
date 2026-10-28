import { useState, useCallback, useMemo } from 'react';
import { Tree, Switch } from '@fibrae/semi-ui-react';

export default function TreeDemo() {
    const [show, setShow] = useState(true);
    const onChange = useCallback((value: boolean) => {
        setShow(value);
    }, []);
    const treeData = useMemo(() => {
        return [
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
    }, []);

    const style = {
        width: 260,
        height: 420,
        border: '1px solid var(--semi-color-border)',
    };

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', columnGap: 5, marginBottom: 5 }}>
                <strong id="tree-line-show-line">showLine </strong>
                <Switch aria-labelledby="tree-line-show-line" checked={show} onChange={onChange} />
            </div>
            <Tree showLine={show} defaultExpandAll treeData={treeData} style={style} />
        </>
    );
}
