import { createSignal, onMount } from 'solid-js';
import { Lottie } from '@fibrae/semi-ui-solid';

const jsonURL = '/assets/root-web-sites/lottie_demo.json';

export default function LottieDemo() {
    const [data, setData] = createSignal<object | string>('');

    onMount(() => {
        void fetch(jsonURL)
            .then((resp) => resp.json())
            .then((json: object) => setData(json));
    });

    return (
        <div>
            <Lottie params={{ animationData: data() }} width="300px" height="300px" />
        </div>
    );
}
