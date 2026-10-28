import { useRef } from 'react';
import { DatePicker, Space, Button, type DatePickerHandle } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    const ref = useRef<DatePickerHandle>(null);

    const handleClickOutside = () => {
        console.log('click outside');
    };

    return (
        <Space vertical align="start">
            <Space>
                <Button onClick={() => ref.current?.open()}>open</Button>
                <Button onClick={() => ref.current?.close()}>close</Button>
                <Button onClick={() => ref.current?.focus()}>focus</Button>
                <Button onClick={() => ref.current?.blur()}>blur</Button>
            </Space>
            <div>
                <DatePicker type="dateTime" ref={ref} onClickOutSide={handleClickOutside} />
            </div>
        </Space>
    );
}
