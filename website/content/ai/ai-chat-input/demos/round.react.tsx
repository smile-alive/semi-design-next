import { useState, useCallback } from 'react';
import { AIChatInput } from '@fibrae/semi-ai-react';
import { IconBookOpenStroked, IconGit, IconTemplateStroked, IconWord } from '@fibrae/semi-icons-react';
import { RadioGroup, Radio, type RadioChangeEvent } from '@fibrae/semi-ui-react';
import { mockUpload } from '#/lib/mock-upload';

const uploadProps = { action: '/upload', customRequest: mockUpload };
const outerStyle = { margin: 12 };
const modelOptions = [
    { value: 'GPT-5', label: 'GPT-5' },
    { value: 'GPT-4o', label: 'GPT-4o' },
    { value: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet' },
];

const mcpOptions = [
    { icon: <IconWord />, label: '办公文档', value: 'office' },
    { icon: <IconGit />, label: 'Github Mcp', value: 'github' },
    { icon: <IconTemplateStroked />, label: 'Design Mcp', value: 'design' },
];

const radioButtonProps = [
    { label: '极速', value: 'fast' },
    { label: '思考', value: 'think' },
    { label: '超能', value: 'super' },
];

export default function AIChatInputDemo() {
    const [round, setRound] = useState(false);
    const renderLeftMenu = useCallback(
        () => (
            <>
                <AIChatInput.Configure.Select optionList={modelOptions} field="model" initValue="GPT-4o" />
                <AIChatInput.Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">
                    联网搜索
                </AIChatInput.Configure.Button>
                <AIChatInput.Configure.Mcp options={mcpOptions} />
                <AIChatInput.Configure.RadioButton options={radioButtonProps} field="mode" initValue="fast" />
            </>
        ),
        []
    );

    const onChange = useCallback((e: RadioChangeEvent) => {
        setRound(e.target.value);
    }, []);

    return (
        <>
            <RadioGroup onChange={onChange} value={round} aria-label="单选组合示例" name="demo-radio-group">
                <Radio value>圆形</Radio>
                <Radio value={false}>方形</Radio>
            </RadioGroup>
            <AIChatInput placeholder="下方按钮为方形的用例" round={round} renderConfigureArea={renderLeftMenu} uploadProps={uploadProps} style={outerStyle} />
        </>
    );
}
