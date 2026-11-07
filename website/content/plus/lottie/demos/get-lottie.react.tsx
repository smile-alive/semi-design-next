import { useEffect } from 'react';
import { Lottie } from '@fibrae/semi-ui-react';

const jsonURL = '/assets/root-web-sites/lottie-demo.json';

export default function LottieDemo() {
    useEffect(() => {
        void Lottie.getLottie().then((lottie) => console.log('lottie', lottie));
    }, []);

    return (
        <div>
            <Lottie getLottie={(lottie) => console.log('lottie', lottie)} params={{ path: jsonURL }} width="300px" height="300px" />
        </div>
    );
}
