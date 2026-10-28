import { Cascader, Toast } from '@fibrae/semi-ui-solid';

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
            multiple
            max={1}
            onExceed={(v) => {
                Toast.warning('exceed max');
                console.log(v);
            }}
            defaultValue={[['zhejiang', 'ningbo', 'haishu']]}
        />
    );
}
