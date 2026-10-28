import { ColorPicker, Button } from '@fibrae/semi-ui-react';
export default function ColorPickerDemo() {
    return (
        <div>
            <ColorPicker
                alpha
                onChange={(value) => {
                    console.log(value);
                }}
                usePopover
            />
            <br />
            <div>自定义 trigger</div>
            <ColorPicker
                alpha
                onChange={(value) => {
                    console.log(value);
                }}
                usePopover
            >
                <Button> Trigger </Button>
            </ColorPicker>
        </div>
    );
}
