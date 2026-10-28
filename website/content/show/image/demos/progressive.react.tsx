import React from 'react';
import { Image, Button } from '@fibrae/semi-ui-react';

export default function ImageDemo() {
    const [timestamp, setTimestamp] = React.useState('');
    return (
        <>
            <Image width={300} height={200} alt="Abstract colorful artwork" src={`/assets/root-web-sites/abstract-big.png?${timestamp}`} placeholder={<Image src="/assets/root-web-sites/abstract-small.jpeg" width={300} height={200} alt="" preview={false} />} />
            <br />
            <Button
                theme="solid"
                onClick={() => {
                    setTimestamp(String(Date.now()));
                }}
                style={{ marginTop: 10 }}
            >
                Reload
            </Button>
        </>
    );
}
