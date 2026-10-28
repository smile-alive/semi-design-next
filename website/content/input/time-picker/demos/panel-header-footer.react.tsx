import { useState } from 'react';
import { TimePicker, Button } from '@fibrae/semi-ui-react';

export default function TimePickerDemo() {
    const [open, setOpen] = useState(false);
    const closePanel = () => setOpen(false);
    const onOpenChange = (open: boolean) => {
        setOpen(open);
        console.log(open);
    };

    return (
        <div>
            <TimePicker open={open} onOpenChange={onOpenChange} panelHeader="Time Select" panelFooter={<Button onClick={closePanel}>close</Button>} />
            <br />
            <br />
            <TimePicker
                type="timeRange"
                panelHeader={['start header', 'end header']}
                panelFooter={[
                    <Button
                        key="1"
                        onClick={() => {
                            console.log('start footer');
                        }}
                    >
                        start footer
                    </Button>,
                    <Button
                        key="2"
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
