import { createSignal } from 'solid-js';
import { Button, type UserGuideStepItem, UserGuide } from '@fibrae/semi-ui-solid';

const steps = [
    {
        target: () => document.querySelector('#mask-demo'),
        title: 'No Mask',
        description: 'Hello ByteDancer!',
    },
] satisfies UserGuideStepItem[];

export default function UserGuideDemo() {
    const [visible, setVisible] = createSignal(false);
    const showDialog = () => {
        setVisible(true);
    };
    return (
        <div>
            <Button id="mask-demo" onClick={showDialog}>
                开始引导
            </Button>
            <UserGuide
                mode="popup"
                mask={false}
                visible={visible()}
                steps={steps}
                onFinish={() => {
                    setVisible(false);
                    console.log('引导完成');
                }}
                onSkip={() => {
                    setVisible(false);
                    console.log('跳过引导');
                }}
            />
        </div>
    );
}
