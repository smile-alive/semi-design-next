import { ColorPicker } from '@fibrae/semi-ui-react';
export default function ColorPickerDemo() {
    return (
        <ColorPicker
            alpha
            onChange={(value) => {
                console.log(value);
            }}
        />
    );
}
