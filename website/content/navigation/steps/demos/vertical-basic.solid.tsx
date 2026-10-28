import { Steps } from '@fibrae/semi-ui-solid';

export default function StepsDemo() {
    return (
        <Steps direction="vertical" type="basic" current={1} onChange={(i) => console.log(i)}>
            <Steps.Step title="Finished" description="This is a description" />
            <Steps.Step title="In Progress" description="This is a description" />
            <Steps.Step title="Waiting" description="This is a description" />
        </Steps>
    );
}
