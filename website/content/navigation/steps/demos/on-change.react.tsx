import { useState } from 'react';
import { Steps } from '@fibrae/semi-ui-react';

const steps = [{ title: 'First' }, { title: 'Second' }, { title: 'Last' }];

export default function StepsDemo() {
    const [current, setCurrent] = useState(1);

    const onChange = (index: number) => {
        setCurrent(index);
    };

    return (
        <div>
            <Steps type="basic" current={current} onChange={onChange}>
                {steps.map((item) => (
                    <Steps.Step key={item.title} title={item.title} />
                ))}
            </Steps>
        </div>
    );
}
