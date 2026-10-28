import { ColorPicker } from '@fibrae/semi-ui-react';
export default function ColorPickerDemo() {
    return (
        <ColorPicker
            topSlot={<div> TopSlot</div>}
            bottomSlot={<div>Bottom Slot</div>}
            alpha
            onChange={(value) => {
                console.log(value);
            }}
        />
    );
}
