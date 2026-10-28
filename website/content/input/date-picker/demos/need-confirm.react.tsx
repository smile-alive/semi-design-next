import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return (
        <DatePicker
            type="dateTime"
            needConfirm
            onConfirm={(...args) => {
                console.log('Confirmed: ', ...args);
            }}
            onCancel={(...args) => {
                console.log('Canceled: ', ...args);
            }}
            onChange={(...args) => {
                console.log('Changed: ', ...args);
            }}
        />
    );
}
