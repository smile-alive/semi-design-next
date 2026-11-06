import { useState, useCallback, type MouseEvent } from 'react';
import * as dateFns from 'date-fns';
import { IconClose, IconChevronDown } from '@fibrae/semi-icons-react';
import { DatePicker, Button, ButtonGroup } from '@fibrae/semi-ui-react';

export default function DatePickerDemo() {
    const [date, setDate] = useState<Date | Date[]>();
    const formatToken = 'yyyy-MM-dd HH:mm:ss';
    const onChange = useCallback((date: Date | Date[]) => {
        setDate(date);
        console.log(date);
    }, []);
    const onClear = useCallback((e?: MouseEvent) => {
        e?.stopPropagation();
        setDate(undefined);
    }, []);

    return (
        <DatePicker
            type="dateTimeRange"
            onChange={onChange}
            value={date}
            triggerRender={(triggerProps) => (
                // The clear button is a sibling of the trigger button: buttons cannot nest
                <ButtonGroup theme="light">
                    <Button icon={<IconChevronDown />} iconPosition="right">
                        {Array.isArray(triggerProps.value) && triggerProps.value.length ? `${dateFns.format(triggerProps.value[0], formatToken)} ~ ${dateFns.format(triggerProps.value[1], formatToken)}` : '请选择日期时间范围'}
                    </Button>
                    {Array.isArray(triggerProps.value) && triggerProps.value.length ? <Button icon={<IconClose />} aria-label="清除" onClick={onClear} /> : null}
                </ButtonGroup>
            )}
        />
    );
}
