import { createSignal } from 'solid-js';
import { Checkbox, CheckboxGroup, type CheckboxEvent, type CheckboxValue } from '@fibrae/semi-ui-solid';

const plainOptions = ['Photography', 'Movies', 'Running'];

export default function CheckboxDemo() {
    const [checkedList, setCheckedList] = createSignal<CheckboxValue[]>(['Photography', 'Running']);
    const [indeterminate, setIndeterminate] = createSignal(true);
    const [checkAll, setCheckAll] = createSignal(false);
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
            <div style={{ 'padding-bottom': '8px', 'border-bottom': '1px solid var(--semi-color-border)' }}>
                <Checkbox indeterminate={indeterminate()} onChange={onCheckAllChange} checked={checkAll()} aria-label="Checkbox 示例">
                    Check all
                </Checkbox>
            </div>
            <CheckboxGroup style={{ 'margin-top': '6px' }} options={plainOptions} value={checkedList()} onChange={onChange} aria-label="CheckboxGroup 示例" />
        </div>
    );
}
