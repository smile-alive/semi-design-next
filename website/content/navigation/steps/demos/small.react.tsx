import { Steps } from '@fibrae/semi-ui-react';

export default function StepsDemo() {
    return (
        <Steps type="basic" size="small" current={1} onChange={(i) => console.log(i)}>
            <Steps.Step title="Finished" description="This is a description" />
            <Steps.Step title="In Progress" description="This is a description" />
            <Steps.Step title="Waiting" description="This is a description" />
        </Steps>
    );
}
