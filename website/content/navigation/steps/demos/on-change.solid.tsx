import { createSignal, For } from 'solid-js';
import { Steps } from '@fibrae/semi-ui-solid';

const steps = [{ title: 'First' }, { title: 'Second' }, { title: 'Last' }];

export default function StepsDemo() {
    const [current, setCurrent] = createSignal(1);

    return (
        <div>
            <Steps type="basic" current={current()} onChange={(index) => setCurrent(index)}>
                <For each={steps}>{(item) => <Steps.Step title={item.title} />}</For>
            </Steps>
        </div>
    );
}
