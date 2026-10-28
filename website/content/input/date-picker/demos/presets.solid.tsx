import { DatePicker, type DatePickerPresetsType } from '@fibrae/semi-ui-solid';

const presets: DatePickerPresetsType = [
    {
        text: 'Today',
        start: () => new Date(),
        end: () => new Date(),
    },
    () => ({
        text: 'Tomorrow',
        start: new Date(new Date().valueOf() + 1000 * 3600 * 24),
        end: new Date(new Date().valueOf() + 1000 * 3600 * 24),
    }),
];

export default function DatePickerDemo() {
    return <DatePicker type="dateTime" presets={presets} presetPosition="left" />;
}
