import { PinCode } from '@fibrae/semi-ui-solid';

export default function PinCodeDemo() {
    return (
        <>
            <PinCode
                aria-label="Verification code"
                size="large"
                defaultValue="6688"
                count={4}
                onComplete={(value) => console.log('pincode: ', value)}
                onChange={(value) => {
                    console.log(value);
                }}
            />
        </>
    );
}
