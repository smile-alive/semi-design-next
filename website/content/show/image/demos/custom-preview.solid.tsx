import { Image } from '@fibrae/semi-ui-solid';

export default function ImageDemo() {
    return (
        <Image
            width={300}
            height={200}
            alt="Abstract colorful artwork"
            src="/assets/root-web-sites/abstract-small.jpeg"
            preview={{
                src: '/assets/root-web-sites/abstract-big.png',
            }}
        />
    );
}
