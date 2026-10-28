import { createSignal, Show } from 'solid-js';
import { Rating } from '@fibrae/semi-ui-solid';

const desc = ['极差', '较差', '一般', '满意', '非常满意'];

export default function RatingDemo() {
    const [value, setValue] = createSignal(0);
    return (
        <div>
            <span>
                你对获得的帮助是否满意：
                <Show when={value()}>
                    <span>{desc[value() - 1]}</span>
                </Show>
            </span>
            <br />
            <Rating tooltips={desc} onChange={setValue} value={value()} />
        </div>
    );
}
