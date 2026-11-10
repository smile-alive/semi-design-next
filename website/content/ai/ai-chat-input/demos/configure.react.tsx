import { useCallback } from 'react';
import { AIChatInput, type AIChatInputSetup as Setup } from '@fibrae/semi-ai-react';
import { IconBookOpenStroked, IconFeishuLogo, IconGit, IconFigma } from '@fibrae/semi-icons-react';

const uploadProps = { action: 'https://api.semi.design/upload' };
const outerStyle = { margin: 12 };

const modelOptions = [
    { value: 'GPT-5', label: 'GPT-5' },
    { value: 'GPT-4o', label: 'GPT-4o' },
    { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
];

const mcpOptions = [
    { icon: <IconFeishuLogo />, label: '飞书文档', value: 'feishu' },
    { icon: <IconGit />, label: 'Github Mcp', value: 'github' },
    { icon: <IconFigma />, label: 'IconFigma Mcp', value: 'IconFigma' },
];

const radioButtonProps = [
    { label: '极速', value: 'fast' },
    { label: '思考', value: 'think' },
    { label: '超能', value: 'super' },
];

export default function AIChatInputDemo() {
    const onConfigureButtonClick = useCallback(() => {
        console.log('onConfigureButtonClick');
    }, []);

    const renderLeftMenu = useCallback(
        () => (
            <>
                <AIChatInput.Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
                <AIChatInput.Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
                    联网搜索
                </AIChatInput.Configure.Button>
                <AIChatInput.Configure.Mcp options={mcpOptions} onConfigureButtonClick={onConfigureButtonClick} showConfigure />
                <AIChatInput.Configure.RadioButton options={radioButtonProps} field="thinkType" initValue="fast" />
            </>
        ),
        [onConfigureButtonClick]
    );

    const onConfigureChange = useCallback((value: Setup, changedValue?: Setup) => {
        console.log('onConfigureChange', value, changedValue);
    }, []);

    return <AIChatInput placeholder="用于查看左下方配置项的用例" renderConfigureArea={renderLeftMenu} onConfigureChange={onConfigureChange} uploadProps={uploadProps} style={outerStyle} />;
}
