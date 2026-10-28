import { useState } from 'react';
import { Radio, Button } from '@fibrae/semi-ui-react';

export default function RadioDemo() {
    const [disabled, setDisabled] = useState(true);
    const toggleDisabled = () => {
        setDisabled(!disabled);
    };
    return (
        <div>
            <Radio defaultChecked={false} disabled={disabled} aria-label="单选示例" name="demo-radio-disabled">
                Disabled
            </Radio>
            <br />
            <Radio defaultChecked disabled={disabled} aria-label="单选示例" name="demo-radio-defaultChecked-disabled">
                Disabled
            </Radio>
            <div style={{ marginTop: 20 }}>
                <Button type="primary" onClick={toggleDisabled}>
                    Toggle disabled
                </Button>
            </div>
        </div>
    );
}
