import { CheckboxGroup } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    const options = [
        { label: '短视频', value: 'video' },
        { label: '资讯', value: 'news' },
    ];
    return <CheckboxGroup options={options} direction="horizontal" aria-label="CheckboxGroup 示例" />;
}
