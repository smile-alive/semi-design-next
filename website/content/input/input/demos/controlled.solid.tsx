import { createSignal } from 'solid-js';
import { Input } from '@fibrae/semi-ui-solid';

export default function InputDemo() {
    const [value, setValue] = createSignal('controlInput');

    const onChange = (val: string) => {
        console.log(val);
        setValue(val);
    };

    return (
        <>
            <Input aria-label="Controlled input" value={value()} onChange={onChange} />
        </>
    );
}
