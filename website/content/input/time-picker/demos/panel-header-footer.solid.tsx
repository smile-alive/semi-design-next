import { createSignal } from 'solid-js';
import { TimePicker, Button } from '@fibrae/semi-ui-solid';

export default function TimePickerDemo() {
    const [open, setOpen] = createSignal(false);
    const closePanel = () => setOpen(false);
    const onOpenChange = (open: boolean) => {
        setOpen(open);
        console.log(open);
    };

    return (
        <div>
            <TimePicker open={open()} onOpenChange={onOpenChange} panelHeader="Time Select" panelFooter={<Button onClick={closePanel}>close</Button>} />
            <br />
            <br />
            <TimePicker
                type="timeRange"
                panelHeader={['start header', 'end header']}
                panelFooter={[
                    <Button
                        onClick={() => {
                            console.log('start footer');
                        }}
                    >
                        start footer
                    </Button>,
                    <Button
                        onClick={() => {
                            console.log('end footer');
                        }}
                    >
                        end footer
                    </Button>,
                ]}
            />
        </div>
    );
}
