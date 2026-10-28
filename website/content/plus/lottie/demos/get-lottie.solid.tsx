import { onMount } from 'solid-js';
import { Lottie } from '@fibrae/semi-ui-solid';

const jsonURL = '/assets/root-web-sites/lottie_demo.json';

export default function LottieDemo() {
    onMount(() => {
        void Lottie.getLottie().then((lottie) => console.log('lottie', lottie));
    });

    return (
        <div>
            <Lottie getLottie={(lottie) => console.log('lottie', lottie)} params={{ path: jsonURL }} width="300px" height="300px" />
        </div>
    );
}
