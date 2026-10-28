import { ColorPicker } from '@fibrae/semi-ui-react';

export default function ColorPickerDemo() {
    return (
        <div>
            <ColorPicker
                defaultValue={ColorPicker.colorStringToValue('rgb(57,197,187)')}
                onChange={(value) => {
                    console.log(value);
                }}
                alpha
            />
        </div>
    );
}
