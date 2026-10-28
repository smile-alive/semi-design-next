import { useState } from 'react';
import { UserGuide, Button, Space, Tag, Switch } from '@fibrae/semi-ui-react';

export default function UserGuideDemo() {
    const [visible, setVisible] = useState(false);
    const showDialog = () => {
        setVisible(true);
    };
    return (
        <div>
            <Button onClick={showDialog}>开始引导</Button>
            <br />
            <br />
            <Space>
                <Switch aria-label="示例开关" id="theme-demo-1" defaultChecked />
                <Tag id="theme-demo-2"> Default Tag </Tag>
                <Button id="theme-demo-3">确定</Button>
            </Space>
            <UserGuide
                mode="popup"
                mask
                visible={visible}
                theme="primary"
                steps={[
                    {
                        target: () => document.querySelector('#theme-demo-1'),
                        title: '新手引导',
                        description: 'Hello ByteDancer!',
                        position: 'bottom',
                    },
                    {
                        target: () => document.querySelector('#theme-demo-2'),
                        title: 'Switch',
                        description: 'This is a Semi Switch',
                        position: 'bottom',
                    },
                    {
                        target: () => document.querySelector('#theme-demo-3'),
                        title: 'Button',
                        description: 'This is a Semi Button',
                        position: 'bottom',
                    },
                ]}
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
