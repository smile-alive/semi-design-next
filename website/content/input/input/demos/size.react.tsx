import { Input } from '@fibrae/semi-ui-react';

export default function InputDemo() {
    return (
        <>
            <Input placeholder="large" size="large" />
            <br />
            <br />
            <Input placeholder="default" />
            <br />
            <br />
            <Input placeholder="small" size="small" />
        </>
    );
}
