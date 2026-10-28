import { useState } from 'react';
import { Checkbox, Button, type CheckboxEvent } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    const [checked, setChecked] = useState(true);
    const [disabled, setDisabled] = useState(false);

    const toggleChecked = () => {
        setChecked(!checked);
    };

    const toggleDisable = () => {
        setDisabled(!disabled);
    };

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
                <Button type="primary" size="small" onClick={toggleChecked}>
                    {!checked ? 'Check' : 'Uncheck'}
                </Button>
                <Button style={{ marginLeft: '10px' }} type="primary" size="small" onClick={toggleDisable}>
                    {!disabled ? 'Disable' : 'Enable'}
                </Button>
            </p>
        </div>
    );
}
