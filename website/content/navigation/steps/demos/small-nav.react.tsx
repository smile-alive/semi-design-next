import { Steps } from '@fibrae/semi-ui-react';

export default function StepsDemo() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Steps type="nav" size="small" current={1} style={{ margin: 'auto' }} onChange={(i) => console.log(i)}>
                <Steps.Step title="注册账号" />
                <Steps.Step title="这个项目的文字比较多多多多" />
                <Steps.Step title="产品用途" />
                <Steps.Step title="期待尝试功能" />
            </Steps>
        </div>
    );
}
