import { createSignal } from 'solid-js';
import { Button, PinCode } from '@fibrae/semi-ui-solid';

export default function PinCodeDemo() {
    const [value, setValue] = createSignal('69af41');
    return (
        <>
            <Button onClick={() => setValue(String(Math.floor(Math.random() * 100000000)).slice(0, 6))}>Set Random Value</Button>
            <br />
            <br />
            <PinCode
                aria-label="Verification code"
                format="mixed"
                onComplete={(code) => console.log('pincode: ', code)}
                value={value()}
                onChange={(code) => {
                    console.log(code);
                    setValue(code);
                }}
            />
        </>
    );
}
