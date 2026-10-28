import { ColorPicker } from '@fibrae/semi-ui-solid';

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
