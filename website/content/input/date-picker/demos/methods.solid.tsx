import { Button, DatePicker, Space, type DatePickerElement } from '@fibrae/semi-ui-solid';

export default function DatePickerDemo() {
    let ref: DatePickerElement | undefined;

    const handleClickOutside = () => {
        console.log('click outside');
    };

    return (
        <Space vertical align="start">
            <Space>
                <Button onClick={() => ref?.open()}>open</Button>
                <Button onClick={() => ref?.close()}>close</Button>
                <Button onClick={() => ref?.focus()}>focus</Button>
                <Button onClick={() => ref?.blur()}>blur</Button>
            </Space>
            <div>
                <DatePicker type="dateTime" ref={(node) => (ref = node)} onClickOutSide={handleClickOutside} />
            </div>
        </Space>
    );
}
