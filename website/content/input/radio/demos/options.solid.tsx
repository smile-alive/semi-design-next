import { createSignal } from 'solid-js';
import { RadioGroup, Space, type RadioChangeEvent } from '@fibrae/semi-ui-solid';

const plainOptions = ['Guest', 'Developer', 'Maintainer'];
const options = [
    { label: 'Guest', value: 'Guest', extra: 'Semi Design', style: { width: '120px' } },
    { label: 'Developer', value: 'Developer', extra: 'Semi Design', style: { width: '120px' } },
    { label: 'Maintainer', value: 'Maintainer', extra: 'Semi Design', style: { width: '120px' } },
];
const optionsWithDisabled = [
    { label: 'Guest', value: 'Guest' },
    { label: 'Developer', value: 'Developer' },
    { label: 'Maintainer', value: 'Maintainer', disabled: true },
];

export default function RadioDemo() {
    const [value1, setValue1] = createSignal('Guest');
    const [value2, setValue2] = createSignal('Developer');
    const [value3, setValue3] = createSignal('Maintainer');

    const onChange1 = (e: RadioChangeEvent) => {
        console.log('radio1 checked', e.target.value);
        setValue1(e.target.value);
    };
    const onChange2 = (e: RadioChangeEvent) => {
        console.log('radio2 checked', e.target.value);
        setValue2(e.target.value);
    };
    const onChange3 = (e: RadioChangeEvent) => {
        console.log('radio3 checked', e.target.value);
        setValue3(e.target.value);
    };

    return (
        <Space vertical align="start" spacing="loose">
            <RadioGroup options={plainOptions} onChange={onChange1} value={value1()} aria-label="单选组合示例" name="demo-radio-group-1" />
            <RadioGroup options={optionsWithDisabled} onChange={onChange2} value={value2()} aria-label="单选组合示例" name="demo-radio-group-2" />
            <RadioGroup options={options} onChange={onChange3} value={value3()} aria-label="单选组合示例" name="demo-radio-group-3" />
        </Space>
    );
}
