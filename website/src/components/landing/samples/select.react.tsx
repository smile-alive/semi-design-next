import { useState } from 'react';
import { Select } from '@fibrae/semi-ui-react';

const optionList = [
    { value: 'video', label: '短视频' },
    { value: 'editing', label: '剪辑' },
];

export default function Demo() {
    const [value, setValue] = useState<string | undefined>('video');

    return (
        <Select
            value={value}
            optionList={optionList}
            onChange={setValue}
        />
    );
}
