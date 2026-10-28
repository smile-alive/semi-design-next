import { Cascader, Typography } from '@fibrae/semi-ui-solid';

const slotStyle = {
    height: '36px',
    display: 'flex',
    padding: '0 32px',
    'align-items': 'center',
    cursor: 'pointer',
    'border-top': '1px solid var(--semi-color-border)',
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

export default function CascaderDemo() {
    return (
        <Cascader
            style={{ width: '300px' }}
            treeData={treeData}
            placeholder="请选择所在地区"
            bottomSlot={
                <div style={slotStyle}>
                    <Typography.Text>找不到相关选项？</Typography.Text>
                    <Typography.Text link>去新建</Typography.Text>
                </div>
            }
        />
    );
}
