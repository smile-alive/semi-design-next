<script lang="ts">
    import { Checkbox, CheckboxGroup, type CheckboxEvent, type CheckboxValue } from '@fibrae/semi-ui-svelte';

    const plainOptions = ['Photography', 'Movies', 'Running'];
    let checkedList = $state<CheckboxValue[]>(['Photography', 'Running']);
    let indeterminate = $state(true);
    let checkAll = $state(false);

    const onChange = (list: CheckboxValue[]) => {
        checkedList = list;
        indeterminate = !!list.length && list.length < plainOptions.length;
        checkAll = list.length === plainOptions.length;
    };
    const onCheckAllChange = (e: CheckboxEvent) => {
        console.log(e);
        checkedList = e.target.checked ? plainOptions : [];
        indeterminate = false;
        checkAll = e.target.checked;
    };
</script>

<div>
    <div style="padding-bottom: 8px; border-bottom: 1px solid var(--semi-color-border)">
        <Checkbox aria-label="Checkbox 示例" checked={checkAll} {indeterminate} onChange={onCheckAllChange}>Check all</Checkbox>
    </div>
    <CheckboxGroup aria-label="CheckboxGroup 示例" {onChange} options={plainOptions} style="margin-top: 6px" value={checkedList} />
</div>
