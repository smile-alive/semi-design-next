import { useState } from 'react';
import { Tag, RadioGroup, Radio } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    const [visible, setVisible] = useState(false);
    const toggleVisible = () => {
        setVisible(!visible);
    };
    return (
        <div>
            <RadioGroup type="button" defaultValue={0} onChange={toggleVisible}>
                <Radio value={1}>Show</Radio>
                <Radio value={0}>Hide</Radio>
            </RadioGroup>
            <div style={{ marginTop: 10 }}>
                <Tag visible={visible} size="large" color="light-blue">
                    Invisible tag
                </Tag>
            </div>
        </div>
    );
}
