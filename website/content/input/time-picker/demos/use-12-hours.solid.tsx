import { TimePicker } from '@fibrae/semi-ui-solid';

export default function TimePickerDemo() {
    return (
        <div>
            <TimePicker use12Hours />
            <br />
            <br />
            <TimePicker use12Hours format="a h:mm" />
        </div>
    );
}
