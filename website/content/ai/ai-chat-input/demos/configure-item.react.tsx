import { AIChatInput, getConfigureItem, type AIChatInputLeftMenuChangeProps as LeftMenuChangeProps } from '@fibrae/semi-ai-react';
import { Cascader, type CascaderProps } from '@fibrae/semi-ui-react';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };
const cascaderModalOptions = [
    {
        label: 'GPT',
        value: 'GPT',
        children: [
            { label: 'GPT-4o', value: 'GPT-4o' },
            { value: 'GPT-5', label: 'GPT-5' },
        ],
    },
    {
        label: 'Claude',
        value: 'Claude',
        children: [{ label: 'Claude 3.5 Sonnet', value: 'Claude 3.5 Sonnet' }],
    },
];

function myCascader(props: CascaderProps) {
    return <Cascader {...props} />;
}

const CustomCascader = getConfigureItem(myCascader, {
    className: 'aiChatInput-cascader-configure',
});

export default function AIChatInputDemo() {
    const renderLeftMenu = () => <CustomCascader field="model" treeData={cascaderModalOptions} initValue={['GPT', 'GPT-4o']} />;

    const onConfigureChange = (value: LeftMenuChangeProps, changedValue?: LeftMenuChangeProps) => {
        console.log('onConfigureChange', value, changedValue);
    };

    return <AIChatInput placeholder="用于查看左下方配置项的用例" renderConfigureArea={renderLeftMenu} onConfigureChange={onConfigureChange} uploadProps={uploadProps} style={outerStyle} />;
}
