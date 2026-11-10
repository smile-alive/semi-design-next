import { CheckboxGroup } from '@fibrae/semi-ui-solid';

const options = [
    { label: '短视频', value: 'video' },
    { label: '资讯', value: 'news' },
];

export default function CheckboxDemo() {
    return <CheckboxGroup options={options} direction="horizontal" aria-label="CheckboxGroup 示例" />;
}
