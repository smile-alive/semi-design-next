import { useState } from 'react';
import { Checkbox, CheckboxGroup, type CheckboxEvent, type CheckboxValue } from '@fibrae/semi-ui-react';

const plainOptions = ['Photography', 'Movies', 'Running'];

export default function CheckboxDemo() {
    const [checkedList, setCheckedList] = useState<CheckboxValue[]>(['Photography', 'Running']);
    const [indeterminate, setIndeterminate] = useState(true);
    const [checkAll, setCheckAll] = useState(false);
    const onChange = (list: CheckboxValue[]) => {
        setCheckedList(list);
        setIndeterminate(!!list.length && list.length < plainOptions.length);
        setCheckAll(list.length === plainOptions.length);
    };
    const onCheckAllChange = (e: CheckboxEvent) => {
        console.log(e);
        setCheckedList(e.target.checked ? plainOptions : []);
        setIndeterminate(false);
        setCheckAll(e.target.checked);
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
