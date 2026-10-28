import { Lottie } from '@fibrae/semi-ui-react';

export default function LottieDemo() {
    const jsonURL = '/assets/root-web-sites/lottie_demo.json';

    return (
        <div>
            <Lottie params={{ path: jsonURL }} width="300px" height="300px" />
        </div>
    );
}
