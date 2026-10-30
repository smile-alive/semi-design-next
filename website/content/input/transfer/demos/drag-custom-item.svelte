<script lang="ts">
    import { IconClose, IconHandle } from '@fibrae/semi-icons-svelte';
    import { Avatar, Button, Checkbox, Transfer, type AvatarColor, type TransferDataItem, type TransferValue } from '@fibrae/semi-ui-svelte';

    interface Person extends TransferDataItem {
        abbr: string;
        color: AvatarColor;
    }

    const customFilter = (searchValue: string, item: TransferDataItem) => String(item.value).includes(searchValue) || String(item.label).includes(searchValue);

    const data = [
        { label: '夏可漫', value: 'xiakeman@example.com', abbr: '夏', color: 'amber', area: 'US', key: 1 },
        { label: '申悦', value: 'shenyue@example.com', abbr: '申', color: 'indigo', area: 'UK', key: 2 },
        { label: '文嘉茂', value: 'wenjiamao@example.com', abbr: '文', color: 'cyan', area: 'HK', key: 3 },
        { label: '曲晨一', value: 'quchenyi@example.com', abbr: '曲', color: 'blue', area: 'India', key: 4 },
        { label: '曲晨二', value: 'quchener@example.com', abbr: '二', color: 'blue', area: 'India', key: 5 },
        { label: '曲晨三', value: 'quchensan@example.com', abbr: '三', color: 'blue', area: 'India', key: 6 },
    ] satisfies Person[];

    const inputProps = { placeholder: '搜索姓名或邮箱' };

    const onChange = (values: TransferValue, items: TransferDataItem[]) => console.log(values, items);
</script>

{#snippet grip()}
    <IconHandle class="semi-right-item-drag-handler" />
{/snippet}

<Transfer dataSource={data} draggable filter={customFilter} {inputProps} {onChange} style="width: 568px" value={['xiakeman@example.com', 'shenyue@example.com']}>
    {#snippet sourceItem({ item, checked, onChange: onItemChange })}
        {@const person = item as Person}
        <div class="components-transfer-demo-source-item">
            <Checkbox {checked} onChange={onItemChange} style="height: 52px; align-items: center">
                <Avatar color={person.color} size="small">{person.abbr}</Avatar>
                <div class="info">
                    <div class="name">{item.label}</div>
                    <div class="email">{item.value}</div>
                </div>
            </Checkbox>
        </div>
    {/snippet}
    {#snippet selectedItem({ item, handle, onRemove })}
        {@const person = item as Person}
        {#if handle}
            <div class="components-transfer-demo-selected-item">
                {@render handle(grip)}
                <Avatar color={person.color} size="small">{person.abbr}</Avatar>
                <div class="info">
                    <div class="name">{item.label}</div>
                    <div class="email">{item.value}</div>
                </div>
                <Button aria-label={`移除 ${item.label}`} class="remove" size="small" theme="borderless" type="tertiary" onclick={onRemove}>
                    {#snippet icon()}<IconClose />{/snippet}
                </Button>
            </div>
        {/if}
    {/snippet}
</Transfer>
