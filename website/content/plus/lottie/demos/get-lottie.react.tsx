import { useEffect } from 'react';
import { Lottie } from '@fibrae/semi-ui-react';

export default function LottieDemo() {
    const jsonURL = '/assets/root-web-sites/lottie_demo.json';

    useEffect(() => {
        void Lottie.getLottie().then((lottie) => console.log('lottie', lottie));
    }, []);

    return (
        <div>
            <Lottie getLottie={(lottie) => console.log('lottie', lottie)} params={{ path: jsonURL }} width="300px" height="300px" />
        </div>
    );
}
