import { useState } from 'react';
import { Checkbox, Button, type CheckboxEvent } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    const [checked, setChecked] = useState(true);
    const [disabled, setDisabled] = useState(false);

    const onChange = (e: CheckboxEvent) => {
        console.log('checked = ', e.target.checked);
        setChecked(e.target.checked);
    };

    const label = `${checked ? 'Checked' : 'Unchecked'} ${disabled ? 'Disabled' : 'Enabled'}`;
    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <Checkbox checked={checked} disabled={disabled} onChange={onChange} aria-label="Checkbox 示例">
                    {label}
                </Checkbox>
            </div>
            <p>
                <Button type="primary" size="small" onClick={() => setChecked(!checked)}>
                    {!checked ? 'Check' : 'Uncheck'}
                </Button>
                <Button style={{ marginLeft: '10px' }} type="primary" size="small" onClick={() => setDisabled(!disabled)}>
                    {!disabled ? 'Disable' : 'Enable'}
                </Button>
            </p>
        </div>
    );
}
