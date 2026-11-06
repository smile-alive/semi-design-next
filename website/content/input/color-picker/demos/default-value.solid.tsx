import { ColorPicker } from '@fibrae/semi-ui-solid';

const defaultValue = ColorPicker.colorStringToValue('rgb(57,197,187)');

export default function ColorPickerDemo() {
    return (
        <div>
            <ColorPicker
                defaultValue={defaultValue}
                onChange={(value) => {
                    console.log(value);
                }}
                alpha
            />
        </div>
    );
}
