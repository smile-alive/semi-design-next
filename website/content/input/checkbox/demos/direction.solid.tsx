import { CheckboxGroup } from '@fibrae/semi-ui-solid';

const options = [
    { label: '抖音', value: 'abc' },
    { label: '今日头条', value: 'toutiao' },
];

export default function CheckboxDemo() {
    return <CheckboxGroup options={options} direction="horizontal" aria-label="CheckboxGroup 示例" />;
}
