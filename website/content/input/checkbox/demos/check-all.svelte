<script lang="ts">
    import { Checkbox, CheckboxGroup, type CheckboxEvent, type CheckboxValue } from '@fibrae/semi-ui-svelte';

    const plainOptions = ['Photography', 'Movies', 'Running'];
    let checkedList = $state<CheckboxValue[]>(['Photography', 'Running']);
    const checkAll = $derived(checkedList.length === plainOptions.length);
    const indeterminate = $derived(checkedList.length > 0 && !checkAll);

    const onCheckAllChange = (e: CheckboxEvent) => {
        console.log(e);
        checkedList = e.target.checked ? plainOptions : [];
    };
</script>

<div>
    <div style="padding-bottom: 8px; border-bottom: 1px solid var(--semi-color-border)">
        <Checkbox aria-label="Checkbox 示例" checked={checkAll} {indeterminate} onChange={onCheckAllChange}>Check all</Checkbox>
    </div>
    <CheckboxGroup aria-label="CheckboxGroup 示例" bind:value={checkedList} options={plainOptions} style="margin-top: 6px" />
</div>
