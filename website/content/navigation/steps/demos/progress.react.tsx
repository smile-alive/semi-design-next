import { useState } from 'react';
import { Steps, Button } from '@fibrae/semi-ui-react';

export default function StepsDemo() {
    const [current, setCurrent] = useState(0);
    const { Step } = Steps;
    const steps = [
        {
            title: 'First',
            content: 'First-content',
        },
        {
            title: 'Second',
            content: 'Second-content',
        },
        {
            title: 'Last',
            content: 'Last-content',
        },
    ];

    const next = () => {
        setCurrent(current + 1);
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    return (
        <div>
            <Steps type="basic" current={current} onChange={(i) => console.log(i)}>
                {steps.map((item) => (
                    <Step key={item.title} title={item.title} />
                ))}
            </Steps>
            <div className="steps-content" style={{ marginTop: 4, marginBottom: 4 }}>
                {steps[current].content}
            </div>
            <div className="steps-action">
                {current < steps.length - 1 && (
                    <Button type="primary" onClick={next}>
                        Next
                    </Button>
                )}
                {current === steps.length - 1 && (
                    <Button type="primary" onClick={() => console.log('Processing complete!')}>
                        Done
                    </Button>
                )}
                {current > 0 && (
                    <Button style={{ marginLeft: 8 }} onClick={prev}>
                        Previous
                    </Button>
                )}
            </div>
        </div>
    );
}
