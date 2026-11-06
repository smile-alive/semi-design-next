<script lang="ts">
    import { IconArrowDown, IconArrowUp, IconDelete } from '@fibrae/semi-icons-svelte';
    import { ArrayField, Button, Form, FormInput, IconButton } from '@fibrae/semi-ui-svelte';

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

<Form style="width: 480px">
    {#snippet children(form)}
        <ArrayField field="steps" {initValue}>
            {#snippet children(arrayField)}
                {#each arrayField.arrayFields as item, index (item.key)}
                    <div style="display: flex; align-items: flex-end; gap: 4px">
                        <FormInput field={`${item.field}.name`} label={`第 ${index + 1} 步`} style="width: 280px" />
                        <IconButton aria-label={`上移第 ${index + 1} 步`} disabled={index === 0} icon={up} theme="borderless" onclick={() => arrayField.onMove(index, index - 1)} />
                        <IconButton aria-label={`下移第 ${index + 1} 步`} disabled={index === arrayField.arrayFields.length - 1} icon={down} theme="borderless" onclick={() => arrayField.onMove(index, index + 1)} />
                        <IconButton aria-label={`删除第 ${index + 1} 步`} icon={remove} theme="borderless" type="danger" onclick={item.onRemove} />
                    </div>
                {/each}
                <Button theme="light" onclick={arrayField.onAdd}>添加一步</Button>
            {/snippet}
        </ArrayField>
        <pre><code>{JSON.stringify(form.formState.values)}</code></pre>
    {/snippet}
</Form>
