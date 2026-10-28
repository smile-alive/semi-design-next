import { TimePicker } from '@fibrae/semi-ui-solid';

export default function TimePickerDemo() {
    return (
        <TimePicker
            type="timeRange"
            disabledTime={(value, panelType) => {
                const start = value[0];
                if (panelType === 'right' && start) {
                    const h = start.getHours();
                    const m = start.getMinutes();
                    return {
                        disabledHours: () => Array.from({ length: h }, (_, i) => i),
                        disabledMinutes: (hour) => (hour === h ? Array.from({ length: m }, (_, i) => i) : []),
                    };
                }
                return {};
            }}
        />
    );
}
