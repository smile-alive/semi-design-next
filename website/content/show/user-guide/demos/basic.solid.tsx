import { createSignal } from 'solid-js';
import { Button, Space, Switch, Tag, type UserGuideStepItem, UserGuide } from '@fibrae/semi-ui-solid';

const steps = [
    {
        target: () => document.querySelector('#basic-demo-1'),
        title: '新手引导',
        description: 'Hello ByteDancer!',
        position: 'bottom',
    },
    {
        target: () => document.querySelector('#basic-demo-2'),
        title: 'Switch',
        description: 'This is a Semi Switch',
        position: 'bottom',
    },
    {
        target: () => document.querySelector('#basic-demo-3'),
        title: 'Button',
        description: 'This is a Semi Button',
        position: 'bottom',
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
                <Switch aria-label="示例开关" id="basic-demo-1" defaultChecked />
                <Tag id="basic-demo-2"> Default Tag </Tag>
                <Button id="basic-demo-3">确定</Button>
            </Space>
            <UserGuide
                mode="popup"
                mask
                visible={visible()}
                steps={steps}
                onChange={(current) => {
                    console.log('当前引导步骤', current);
                }}
                onNext={() => {
                    console.log('下一步引导');
                }}
                onPrev={() => {
                    console.log('上一步引导');
                }}
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
