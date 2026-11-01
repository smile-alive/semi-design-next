import { useState } from 'react';
import { Select } from '@fibrae/semi-ui-react';

const optionList = [
    { value: 'douyin', label: '抖音' },
    { value: 'jianying', label: '剪映' },
];

export default function Demo() {
    const [value, setValue] = useState<string | undefined>('douyin');

    return (
        <Select
            value={value}
            optionList={optionList}
            onChange={setValue}
        />
    );
}
