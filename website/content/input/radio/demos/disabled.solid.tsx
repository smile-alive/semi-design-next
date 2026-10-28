import { createSignal } from 'solid-js';
import { Button, Radio } from '@fibrae/semi-ui-solid';

export default function RadioDemo() {
    const [disabled, setDisabled] = createSignal(true);
    return (
        <div>
            <Radio defaultChecked={false} disabled={disabled()} aria-label="单选示例" name="demo-radio-disabled">
                Disabled
            </Radio>
            <br />
            <Radio defaultChecked disabled={disabled()} aria-label="单选示例" name="demo-radio-defaultChecked-disabled">
                Disabled
            </Radio>
            <div style={{ 'margin-top': '20px' }}>
                <Button type="primary" onClick={() => setDisabled(!disabled())}>
                    Toggle disabled
                </Button>
            </div>
        </div>
    );
}
