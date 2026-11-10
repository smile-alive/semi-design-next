import { createSignal } from 'solid-js';
import { Select } from '@fibrae/semi-ui-solid';

const optionList = [
    { value: 'video', label: '短视频' },
    { value: 'editing', label: '剪辑' },
];

export default function Demo() {
    const [value, setValue] = createSignal<string | undefined>('video');

    return (
        <Select
            value={value()}
            optionList={optionList}
            onChange={(v) => setValue(v)}
        />
    );
}
