import { IconHome, IconLock } from '@fibrae/semi-icons-react';
import { Steps } from '@fibrae/semi-ui-react';

export default function StepsDemo() {
    return (
        <Steps type="basic" onChange={(i) => console.log(i)}>
            <Steps.Step status="finish" title="已完成" />
            <Steps.Step status="error" title="错误" />
            <Steps.Step status="warning" title="警告" />
            <Steps.Step status="process" title="正在进行" icon={<IconHome size="extra-large" />} />
            <Steps.Step status="wait" title="等待" icon={<IconLock size="extra-large" />} />
        </Steps>
    );
}
