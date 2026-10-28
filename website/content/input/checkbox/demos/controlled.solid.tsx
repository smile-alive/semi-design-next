import { createSignal } from 'solid-js';
import { Button, Checkbox, type CheckboxEvent } from '@fibrae/semi-ui-solid';

export default function CheckboxDemo() {
    const [checked, setChecked] = createSignal(true);
    const [disabled, setDisabled] = createSignal(false);

    const onChange = (e: CheckboxEvent) => {
        console.log('checked = ', e.target.checked);
        setChecked(e.target.checked);
    };

    const label = () => `${checked() ? 'Checked' : 'Unchecked'} ${disabled() ? 'Disabled' : 'Enabled'}`;
    return (
        <div>
            <div style={{ 'margin-bottom': '20px' }}>
                <Checkbox checked={checked()} disabled={disabled()} onChange={onChange} aria-label="Checkbox 示例">
                    {label()}
                </Checkbox>
            </div>
            <p>
                <Button type="primary" size="small" onClick={() => setChecked(!checked())}>
                    {!checked() ? 'Check' : 'Uncheck'}
                </Button>
                <Button style={{ 'margin-left': '10px' }} type="primary" size="small" onClick={() => setDisabled(!disabled())}>
                    {!disabled() ? 'Disable' : 'Enable'}
                </Button>
            </p>
        </div>
    );
}
