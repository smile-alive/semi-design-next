import { useState, useRef } from 'react';
import { PinCode, Button, type PinCodeHandle } from '@fibrae/semi-ui-react';

export default function PinCodeDemo() {
    const [value, setValue] = useState('69af41');
    const ref = useRef<PinCodeHandle>(null);
    return (
        <>
            <Button onClick={() => ref.current?.focus(2)}>Focus Third Input</Button>
            <br />
            <br />
            <PinCode
                aria-label="Verification code"
                format="mixed"
                ref={ref}
                onComplete={(value) => console.log('pincode: ', value)}
                value={value}
                onChange={(v) => {
                    console.log(v);
                    setValue(v);
                }}
            />
        </>
    );
}
