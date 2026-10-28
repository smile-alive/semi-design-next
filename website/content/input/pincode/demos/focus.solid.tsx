import { createSignal } from 'solid-js';
import { Button, PinCode } from '@fibrae/semi-ui-solid';

export default function PinCodeDemo() {
    const [value, setValue] = createSignal('69af41');
    let pinCode: HTMLDivElement | undefined;
    return (
        <>
            <Button onClick={() => pinCode?.querySelectorAll<HTMLInputElement>('input').item(2)?.focus()}>Focus Third Input</Button>
            <br />
            <br />
            <PinCode
                aria-label="Verification code"
                format="mixed"
                ref={(node) => (pinCode = node)}
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
