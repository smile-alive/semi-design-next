import { useState, useEffect } from 'react';
import { Lottie } from '@fibrae/semi-ui-react';

export default function LottieDemo() {
    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
    const [data, setData] = useState('');

    useEffect(() => {
        void fetch(jsonURL)
            .then((resp) => resp.json())
            .then(setData);
    }, []);

    return (
        <div>
            <Lottie params={{ animationData: data }} width="300px" height="300px" />
        </div>
    );
}
