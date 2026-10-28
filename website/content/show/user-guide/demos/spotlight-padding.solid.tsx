import { createSignal } from 'solid-js';
import { Button, Space, Switch, Tag, type UserGuideStepItem, UserGuide } from '@fibrae/semi-ui-solid';

const steps = [
    {
        target: () => document.querySelector('#padding-demo-1'),
        title: '新手引导',
        description: 'Hello ByteDancer!',
    },
    {
        target: () => document.querySelector('#padding-demo-2'),
        title: 'New Padding',
        description: 'This is 10px padding',
    },
    {
        target: () => document.querySelector('#padding-demo-3'),
        title: 'Change Padding',
        spotlightPadding: 15,
        description: 'We change the Padding to 15px',
    },
] satisfies UserGuideStepItem[];

export default function UserGuideDemo() {
    const [visible, setVisible] = createSignal(false);
    const showDialog = () => {
        setVisible(true);
    };
    return (
        <div>
            <Button onClick={showDialog}>开始引导</Button>
            <br />
            <br />
            <Space>
                <Switch aria-label="示例开关" id="padding-demo-1" defaultChecked />
                <Tag id="padding-demo-2"> Default Tag </Tag>
                <Button id="padding-demo-3">确定</Button>
            </Space>
            <UserGuide
                mode="popup"
                mask
                visible={visible()}
                spotlightPadding={10}
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
