import { useState } from 'react';
import { Steps } from '@fibrae/semi-ui-react';

export default function StepsDemo() {
    const [current, setCurrent] = useState(1);
    const { Step } = Steps;
    const steps = [{ title: 'First' }, { title: 'Second' }, { title: 'Last' }];

    const onChange = (index: number) => {
        setCurrent(index);
    };

    return (
        <div>
            <Steps type="basic" current={current} onChange={onChange}>
                {steps.map((item) => (
                    <Step key={item.title} title={item.title} />
                ))}
            </Steps>
        </div>
    );
}
