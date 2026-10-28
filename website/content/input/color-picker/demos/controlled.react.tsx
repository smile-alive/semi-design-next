import { useState } from 'react';
import { ColorPicker } from '@fibrae/semi-ui-react';
export default function ColorPickerDemo() {
    const [value, setValue] = useState(ColorPicker.colorStringToValue('#39c5bb'));
    return (
        <div>
            <ColorPicker
                value={value}
                onChange={(value) => {
                    setValue(value);
                }}
                alpha
            />
        </div>
    );
}
