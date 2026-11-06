import { useState } from 'react';
import { PinCode, Button } from '@fibrae/semi-ui-react';

export default function PinCodeDemo() {
    const [value, setValue] = useState('69af41');
    return (
        <>
            <Button onClick={() => setValue(String(Math.floor(Math.random() * 100000000)).slice(0, 6))}>Set Random Value</Button>
            <br />
            <br />
            <PinCode
                aria-label="Verification code"
                format="mixed"
                onComplete={(code) => console.log('pincode: ', code)}
                value={value}
                onChange={(code) => {
                    console.log(code);
                    setValue(code);
                }}
            />
        </>
    );
}
