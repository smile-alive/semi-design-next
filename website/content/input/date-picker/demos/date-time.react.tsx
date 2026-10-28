import { DatePicker } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    return (
        <>
            <h4>默认日期与时间选择</h4>
            <DatePicker type="dateTime" />
            <br />
            <br />
            <h4>开启时间列表无限循环</h4>
            <DatePicker
                type="dateTime"
                timePickerOpts={{
                    scrollItemProps: { mode: 'wheel', cycled: true },
                }}
            />
        </>
    );
}
