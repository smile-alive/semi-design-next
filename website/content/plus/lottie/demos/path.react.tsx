import { Lottie } from '@fibrae/semi-ui-react';

const jsonURL = '/assets/root-web-sites/lottie-demo.json';

export default function LottieDemo() {
    return (
        <div>
            <Lottie params={{ path: jsonURL }} width="300px" height="300px" />
        </div>
    );
}
