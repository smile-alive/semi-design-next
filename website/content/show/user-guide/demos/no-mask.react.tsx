import { useState } from 'react';
import { UserGuide, Button, type UserGuideStepItem } from '@fibrae/semi-ui-react';

const steps: UserGuideStepItem[] = [
    {
        target: () => document.querySelector('#mask-demo'),
        title: 'No Mask',
        description: 'Hello Semi!',
    },
];

export default function UserGuideDemo() {
    const [visible, setVisible] = useState(false);
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
                visible={visible}
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
