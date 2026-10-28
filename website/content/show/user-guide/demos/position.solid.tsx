import { createSignal } from 'solid-js';
import { Button, type UserGuideStepItem, UserGuide } from '@fibrae/semi-ui-solid';

const steps = [
    {
        target: () => document.querySelector('#position-demo'),
        title: '新手引导',
        description: 'Hello ByteDancer!',
        position: 'top',
    },
    {
        target: () => document.querySelector('#position-demo'),
        title: 'New Position',
        description: 'This is Right Position',
        position: 'right',
    },
    {
        target: () => document.querySelector('#position-demo'),
        title: 'Hide Arrow',
        description: 'We hide the arrow',
        position: 'bottom',
        showArrow: false,
    },
] satisfies UserGuideStepItem[];

export default function UserGuideDemo() {
    const [visible, setVisible] = createSignal(false);
    const showDialog = () => {
        setVisible(true);
    };
    return (
        <div>
            <Button id="position-demo" onClick={showDialog}>
                开始引导
            </Button>
            <UserGuide
                mode="popup"
                mask
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
