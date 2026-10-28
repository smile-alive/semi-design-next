import { Button, ColorPicker } from '@fibrae/semi-ui-solid';

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
                {(getTriggerProps) => <Button {...getTriggerProps()}> Trigger </Button>}
            </ColorPicker>
        </div>
    );
}
