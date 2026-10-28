import { useState } from 'react';
import { Cascader, type CascaderValue } from '@fibrae/semi-ui-react';

export default function CascaderDemo() {
    const [value, setValue] = useState<CascaderValue>([]);
    const onChange = (value: CascaderValue) => {
        console.log(value);
        setValue(value);
    };
    const treeData = [
        {
            label: '浙江省',
            value: 'zhejiang',
            children: [
                {
                    label: '杭州市',
                    value: 'hangzhou',
                    children: [
                        {
                            label: '西湖区',
                            value: 'xihu',
                        },
                        {
                            label: '萧山区',
                            value: 'xiaoshan',
                        },
                        {
                            label: '临安区',
                            value: 'linan',
                        },
                    ],
                },
                {
                    label: '宁波市',
                    value: 'ningbo',
                    children: [
                        {
                            label: '海曙区',
                            value: 'haishu',
                        },
                        {
                            label: '江北区',
                            value: 'jiangbei',
                        },
                    ],
                },
            ],
        },
    ];
    return <Cascader style={{ width: 300 }} treeData={treeData} placeholder="开启 leafOnly" value={value} multiple leafOnly onChange={(e) => onChange(e)} />;
}
