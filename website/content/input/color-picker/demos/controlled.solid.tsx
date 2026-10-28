import { createSignal } from 'solid-js';
import { ColorPicker } from '@fibrae/semi-ui-solid';

const INITIAL_VALUE = ColorPicker.colorStringToValue('#39c5bb');

export default function ColorPickerDemo() {
    const [value, setValue] = createSignal(INITIAL_VALUE);
    return (
        <div>
            <ColorPicker value={value()} onChange={setValue} alpha />
        </div>
    );
}
