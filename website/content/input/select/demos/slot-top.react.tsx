import { useState } from 'react';
import { RadioGroup, Select } from '@fibrae/semi-ui-react';

interface Item {
    value: string;
    label: string;
}

export default function SelectDemo() {
    const list: Record<string, Item[]> = {
        component: [
            { value: 'select', label: '选择器' },
            { value: 'tabs', label: '标签' },
            { value: 'avatar', label: '头像' },
            { value: 'button', label: '按钮' },
        ],
        design: [
            { value: 'color', label: '颜色' },
            { value: 'dark', label: '暗色模式' },
            { value: 'icon', label: '图标' },
            { value: 'font', label: '字体' },
        ],
        feedback: [
            { value: 'faq', label: '常见问题' },
            { value: 'join', label: '加入用户群' },
            { value: 'hornbill', label: '犀鸟反馈问题' },
        ],
    };

    const [key, setKey] = useState('component');
    const [value, setValue] = useState<Item | undefined>({ value: 'faq', label: '常见问题' });

    const categoryWrapper = {
        padding: '8px 12px',
        borderBottom: '0.5px solid var(--semi-color-border)',
    };
    const categoryOptions = [
        { value: 'component', label: '组件' },
        { value: 'design', label: '设计' },
        { value: 'feedback', label: '反馈' },
    ];

    // The radio group switches with arrow keys, so categories need no tabpanel association
    const outerTopSlotNode = (
        <div style={categoryWrapper}>
            <RadioGroup type="button" buttonSize="small" aria-label="选项分类" options={categoryOptions} value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
    );
    return <Select aria-label="选项" defaultOpen autoAdjustOverflow={false} value={value} onChangeWithObject onChange={(obj) => setValue(obj)} style={{ width: 200 }} outerTopSlot={outerTopSlotNode} optionList={list[key]} />;
}
