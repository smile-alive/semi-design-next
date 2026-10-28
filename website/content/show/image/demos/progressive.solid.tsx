import { createSignal } from 'solid-js';
import { Button, Image } from '@fibrae/semi-ui-solid';

export default function ImageDemo() {
    const [timestamp, setTimestamp] = createSignal('');
    return (
        <>
            <Image width={300} height={200} alt="Abstract colorful artwork" src={`/assets/root-web-sites/abstract-big.png?${timestamp()}`} placeholder={<Image src="/assets/root-web-sites/abstract-small.jpeg" width={300} height={200} alt="" preview={false} />} />
            <br />
            <Button
                theme="solid"
                onClick={() => {
                    setTimestamp(String(Date.now()));
                }}
                style={{ 'margin-top': '10px' }}
            >
                Reload
            </Button>
        </>
    );
}
