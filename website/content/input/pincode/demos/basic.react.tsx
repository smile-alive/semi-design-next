import { PinCode } from '@fibrae/semi-ui-react';

export default function PinCodeDemo() {
    return (
        <>
            <PinCode
                aria-label="Verification code, small"
                size="small"
                defaultValue="123456"
                onComplete={(value) => console.log('pincode: ', value)}
                onChange={(value) => {
                    console.log(value);
                }}
            />
            <br />
            <PinCode
                aria-label="Verification code, default"
                size="default"
                defaultValue="123456"
                onComplete={(value) => console.log('pincode: ', value)}
                onChange={(value) => {
                    console.log(value);
                }}
            />
            <br />
            <PinCode
                aria-label="Verification code, large"
                size="large"
                defaultValue="123456"
                onComplete={(value) => console.log('pincode: ', value)}
                onChange={(value) => {
                    console.log(value);
                }}
            />
        </>
    );
}
