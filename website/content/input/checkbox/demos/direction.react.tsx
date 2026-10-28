import { CheckboxGroup } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    const options = [
        { label: '抖音', value: 'abc' },
        { label: '今日头条', value: 'toutiao' },
    ];
    return <CheckboxGroup options={options} direction="horizontal" aria-label="CheckboxGroup 示例" />;
}
