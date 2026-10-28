import { ColorPicker } from '@fibrae/semi-ui-solid';

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
