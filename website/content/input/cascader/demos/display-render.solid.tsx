import type { JSX } from 'solid-js';
import { Cascader, Tag, Typography } from '@fibrae/semi-ui-solid';

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

export default function CascaderDemo() {
    return (
        <>
            <Typography.Title heading={6}>单选</Typography.Title>
            <Cascader style={{ width: '300px' }} treeData={treeData} placeholder="自定义回填时显示数据的格式" displayRender={(list) => '已选择：' + list.join(' -> ')} defaultValue={['zhejiang', 'ningbo', 'jiangbei']} />
            <br />
            <br />
            <Typography.Title heading={6}>多选</Typography.Title>
            <Cascader
                multiple
                style={{ width: '300px' }}
                treeData={treeData}
                defaultValue={['zhejiang', 'ningbo', 'jiangbei']}
                placeholder="自定义回填时显示数据的格式"
                displayRender={(item) => (
                    <Tag style={{ 'margin-right': '4px' }} color="white">
                        {item.data.label as JSX.Element}
                    </Tag>
                )}
            />
        </>
    );
}
