import { useState } from 'react';
import { Checkbox, CheckboxGroup, type CheckboxEvent, type CheckboxValue } from '@fibrae/semi-ui-react';

export default function CheckboxDemo() {
    const plainOptions = ['Photography', 'Movies', 'Running'];
    const [checkedList, setCheckedList] = useState<CheckboxValue[]>(['Photography', 'Running']);
    const [indeterminate, setIndeterminate] = useState(true);
    const [checkAll, setCheckall] = useState(false);
    const onChange = (checkedList: CheckboxValue[]) => {
        setCheckedList(checkedList);
        setIndeterminate(!!checkedList.length && checkedList.length < plainOptions.length);
        setCheckall(checkedList.length === plainOptions.length);
    };
    const onCheckAllChange = (e: CheckboxEvent) => {
        console.log(e);
        setCheckedList(e.target.checked ? plainOptions : []);
        setIndeterminate(false);
        setCheckall(e.target.checked);
    };

    return (
        <div>
            <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--semi-color-border)' }}>
                <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll} aria-label="Checkbox 示例">
                    Check all
                </Checkbox>
            </div>
            <CheckboxGroup style={{ marginTop: 6 }} options={plainOptions} value={checkedList} onChange={onChange} aria-label="CheckboxGroup 示例" />
        </div>
    );
}
