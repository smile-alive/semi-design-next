import { createSignal } from 'solid-js';
import { Radio, RadioGroup, Tag } from '@fibrae/semi-ui-solid';

export default function TagDemo() {
    const [visible, setVisible] = createSignal(false);
    const toggleVisible = () => {
        setVisible(!visible());
    };
    return (
        <div>
            <RadioGroup type="button" defaultValue={0} onChange={toggleVisible}>
                <Radio value={1}>Show</Radio>
                <Radio value={0}>Hide</Radio>
            </RadioGroup>
            <div style={{ 'margin-top': '10px' }}>
                <Tag visible={visible()} size="large" color="light-blue">
                    Invisible tag
                </Tag>
            </div>
        </div>
    );
}
