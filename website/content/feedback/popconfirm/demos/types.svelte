<script lang="ts">
    import { IconAlertTriangle } from '@fibrae/semi-icons-svelte';
    import { Button, Popconfirm, Radio, RadioGroup, type RadioValue } from '@fibrae/semi-ui-svelte';

    type TypeKey = 'default' | 'warning' | 'danger' | 'tertiary';

    const typeMap: Record<TypeKey, { okType?: 'danger'; color?: string }> = {
        default: {},
        warning: { color: 'var(--semi-color-warning)' },
        danger: { okType: 'danger', color: 'var(--semi-color-danger)' },
        tertiary: { color: 'var(--semi-color-tertiary)' },
    };
    const keys = Object.keys(typeMap) as TypeKey[];
    let value = $state<RadioValue | undefined>('default');
    let visible = $state(true);
    const type = $derived(keys.find((key) => key === value) ?? 'default');
</script>

<div>
    <RadioGroup bind:value style="margin-top: 14px; margin-bottom: 14px" type="button">
        {#each keys as key (key)}
            <Radio value={key}>
                <span style={`color: var(--semi-color-${key === 'default' ? 'primary' : key})`}>{key}</span>
            </Radio>
        {/each}
    </RadioGroup>
    <div>
        <Popconfirm bind:visible okType={typeMap[type].okType} title="确定是否要保存此修改？" trigger="custom">
            <Button onclick={() => (visible = !visible)}>点击此处</Button>
            {#snippet icon()}
                <IconAlertTriangle size="extra-large" style={typeMap[type].color ? `color: ${typeMap[type].color}` : undefined} />
            {/snippet}
            {#snippet content()}此修改将不可逆{/snippet}
        </Popconfirm>
    </div>
</div>
