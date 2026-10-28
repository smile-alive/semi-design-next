import { TimePicker } from '@fibrae/semi-ui-react';

export default function TimePickerDemo() {
    return (
        <TimePicker
            type="timeRange"
            disabledTime={(value, panelType) => {
                const start = Array.isArray(value) ? value[0] : value;
                if (panelType === 'right' && start instanceof Date) {
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
