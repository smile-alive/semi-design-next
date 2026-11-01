import { createSignal } from 'solid-js';
import { Select } from '@fibrae/semi-ui-solid';

const optionList = [
    { value: 'douyin', label: '抖音' },
    { value: 'jianying', label: '剪映' },
];

export default function Demo() {
    const [value, setValue] = createSignal<string | undefined>('douyin');

    return (
        <Select
            value={value()}
            optionList={optionList}
            onChange={(v) => setValue(v)}
        />
    );
}
