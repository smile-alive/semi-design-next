import { Steps } from '@fibrae/semi-ui-react';

export default function StepsDemo() {
    return (
        <Steps type="basic" current={1} status="error" onChange={(i) => console.log(i)}>
            <Steps.Step title="Finished" description="This is a description" />
            <Steps.Step title="In Process" description="This is a description" />
            <Steps.Step title="Waiting" description="This is a description" />
        </Steps>
    );
}
