import { useState } from 'react';
import { Input } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    const [value, setValue] = useState('controlInput');

    const onChange = (val: string) => {
        console.log(val);
        setValue(val);
    };

    return (
        <>
            <Input aria-label="Controlled input" value={value} onChange={onChange} />
        </>
    );
}
