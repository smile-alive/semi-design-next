import { ColorPicker } from '@fibrae/semi-ui-solid';

const DEFAULT_VALUE = ColorPicker.colorStringToValue('rgb(57,197,187)');

export default function ColorPickerDemo() {
    return (
        <div>
            <ColorPicker
                defaultValue={DEFAULT_VALUE}
                onChange={(value) => {
                    console.log(value);
                }}
                alpha
            />
        </div>
    );
}
