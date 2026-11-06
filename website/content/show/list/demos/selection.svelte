<script lang="ts">
    import { Checkbox, CheckboxGroup, List, Radio, RadioGroup, type CheckboxValue, type RadioValue } from '@fibrae/semi-ui-svelte';

    const data = ['围城', '平凡的世界（全三册）', '三体（全集）', '雪中悍刀行（全集）', '撒哈拉的故事', '明朝那些事', '一禅小和尚', '沙丘', '被讨厌的勇气', '罪与罚', '月亮与六便士', '沉默的大多数', '第一人称单数'];
    const dataSource = data.slice(0, 8);
    let checkboxVal = $state<CheckboxValue[]>([data[0]]);
    let radioVal = $state<RadioValue>(data[0]);
    const listStyle = 'border: 1px solid var(--semi-color-border); flex-basis: 100%; flex-shrink: 0';
</script>

<div style="display: flex">
    <div style="margin-inline-end: 16px; width: 280px; display: flex; flex-wrap: wrap">
        <CheckboxGroup aria-label="书单多选" bind:value={checkboxVal}>
            <List class="component-list-demo-booklist" {dataSource} size="small" split={false} style={listStyle}>
                {#snippet item(row)}
                    <List.Item class="list-item">
                        <Checkbox value={row.item}>{row.item}</Checkbox>
                    </List.Item>
                {/snippet}
            </List>
        </CheckboxGroup>
    </div>
    <div style="margin-inline-end: 16px; width: 280px; display: flex; flex-wrap: wrap">
        <RadioGroup aria-label="书单单选" bind:value={radioVal}>
            <List class="component-list-demo-booklist" {dataSource} size="small" split={false} style={listStyle}>
                {#snippet item(row)}
                    <List.Item class="list-item">
                        <Radio value={row.item}>{row.item}</Radio>
                    </List.Item>
                {/snippet}
            </List>
        </RadioGroup>
    </div>
</div>
