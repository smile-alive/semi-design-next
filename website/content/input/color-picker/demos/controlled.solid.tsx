import { createSignal } from 'solid-js';
import { ColorPicker } from '@fibrae/semi-ui-solid';

export default function ColorPickerDemo() {
    const [value, setValue] = createSignal(ColorPicker.colorStringToValue('#39c5bb'));
    return (
        <div>
            <ColorPicker value={value()} onChange={setValue} alpha />
        </div>
    );
}
