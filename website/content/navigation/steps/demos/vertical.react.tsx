import { Steps } from '@fibrae/semi-ui-react';

export default function StepsDemo() {
    return (
        <Steps direction="vertical" current={1} style={{ width: 300 }} onChange={(i) => console.log(i)}>
            <Steps.Step title="Finished" description="This is a description" />
            <Steps.Step title="In Progress" description="This is a description" />
            <Steps.Step title="Waiting" description="This is a description" />
        </Steps>
    );
}
