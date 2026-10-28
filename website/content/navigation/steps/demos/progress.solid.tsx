import { createSignal, For, Show } from 'solid-js';
import { Button, Steps } from '@fibrae/semi-ui-solid';

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

export default function StepsDemo() {
    const [current, setCurrent] = createSignal(0);

    const next = () => {
        setCurrent(current() + 1);
    };

    const prev = () => {
        setCurrent(current() - 1);
    };

    return (
        <div>
            <Steps type="basic" current={current()} onChange={(i) => console.log(i)}>
                <For each={steps}>{(item) => <Steps.Step title={item.title} />}</For>
            </Steps>
            <div class="steps-content" style={{ 'margin-top': '4px', 'margin-bottom': '4px' }}>
                {steps[current()].content}
            </div>
            <div class="steps-action">
                <Show when={current() < steps.length - 1}>
                    <Button type="primary" onClick={next}>
                        Next
                    </Button>
                </Show>
                <Show when={current() === steps.length - 1}>
                    <Button type="primary" onClick={() => console.log('Processing complete!')}>
                        Done
                    </Button>
                </Show>
                <Show when={current() > 0}>
                    <Button style={{ 'margin-left': '8px' }} onClick={prev}>
                        Previous
                    </Button>
                </Show>
            </div>
        </div>
    );
}
