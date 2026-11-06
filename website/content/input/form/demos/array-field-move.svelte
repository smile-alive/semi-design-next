<script lang="ts">
    import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-svelte';
    import { ArrayField, Button, Form, FormInput } from '@fibrae/semi-ui-svelte';

    const initValue = [{ name: '需求评审' }, { name: '开发' }, { name: '上线' }];
</script>

{#snippet up()}
    <IconArrowUp />
{/snippet}

{#snippet down()}
    <IconArrowDown />
{/snippet}

{#snippet remove()}
    <IconDelete />
{/snippet}

{#snippet plus()}
    <IconPlus />
{/snippet}

<Form style="width: 480px">
    {#snippet children({ values })}
        <ArrayField field="steps" {initValue}>
            {#snippet children({ arrayFields, onAdd, onMove })}
                {#each arrayFields as item, index (item.key)}
                    <div style="display: flex; align-items: flex-end; gap: 4px">
                        <FormInput field={`${item.field}.name`} label={`步骤 ${index + 1}`} style="width: 240px" />
                        <Button aria-label={`上移步骤 ${index + 1}`} disabled={index === 0} icon={up} style="margin-block-end: 12px" theme="borderless" type="tertiary" onclick={() => onMove(index, index - 1)} />
                        <Button aria-label={`下移步骤 ${index + 1}`} disabled={index === arrayFields.length - 1} icon={down} style="margin-block-end: 12px" theme="borderless" type="tertiary" onclick={() => onMove(index, index + 1)} />
                        <Button aria-label={`删除步骤 ${index + 1}`} icon={remove} style="margin-block-end: 12px" theme="borderless" type="danger" onclick={item.onRemove} />
                    </div>
                {/each}
                <Button icon={plus} onclick={onAdd}>添加步骤</Button>
            {/snippet}
        </ArrayField>
        <pre>{JSON.stringify(values.steps)}</pre>
    {/snippet}
</Form>
