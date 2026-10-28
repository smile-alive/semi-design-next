import { Lottie } from '@fibrae/semi-ui-solid';

const jsonURL = '/assets/root-web-sites/lottie_demo.json';

export default function LottieDemo() {
    return (
        <div>
            <Lottie
                getAnimationInstance={(animation) => {
                    console.log(animation);
                }}
                params={{ path: jsonURL }}
                width="300px"
                height="300px"
            />
        </div>
    );
}
