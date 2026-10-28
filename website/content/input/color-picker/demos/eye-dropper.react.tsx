import { ColorPicker } from '@fibrae/semi-ui-react';
export default function ColorPickerDemo() {
    return (
        <ColorPicker
            alpha
            eyeDropper
            onChange={(value) => {
                console.log(value);
            }}
        />
    );
}
