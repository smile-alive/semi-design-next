import { createSignal } from 'solid-js';
import { Button, type ButtonProps, Space, Switch, Tag, type UserGuideStepItem, UserGuide } from '@fibrae/semi-ui-solid';

const nextButtonProps = { children: 'Next' } satisfies ButtonProps;
const prevButtonProps = { children: 'Prev', theme: 'borderless' } satisfies ButtonProps;

const steps = [
    {
        target: () => document.querySelector('#button-demo-1'),
        title: '新手引导',
        description: 'Hello ByteDancer!',
    },
    {
        target: () => document.querySelector('#button-demo-2'),
        title: 'New Button Style',
        description: 'Button text is Next',
    },
    {
        target: () => document.querySelector('#button-demo-3'),
        title: 'New finish button text',
        description: 'Button text is I know',
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
                <Switch aria-label="示例开关" id="button-demo-1" defaultChecked />
                <Tag id="button-demo-2"> Default Tag </Tag>
                <Button id="button-demo-3">确定</Button>
            </Space>
            <UserGuide
                mode="popup"
                mask
                visible={visible()}
                nextButtonProps={nextButtonProps}
                prevButtonProps={prevButtonProps}
                finishText="我知道啦！"
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
