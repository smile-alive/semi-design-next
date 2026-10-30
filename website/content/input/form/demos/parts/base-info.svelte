<script lang="ts">
    import { Input, Select } from '@fibrae/semi-ui-svelte';

    interface BaseInfo {
        name?: string;
        role?: string;
    }

    // The Field passes the value and the change callback; aria-required is a prop for each control
    let { value, onChange, 'aria-required': ariaRequired }: { value?: BaseInfo; onChange?: (value: BaseInfo) => void; 'aria-required'?: boolean | 'true' | 'false' } = $props();

    const roles = [
        { value: 'rd', label: '开发' },
        { value: 'UED', label: '设计师' },
    ];

    const update = (patch: BaseInfo) => onChange?.({ ...value, ...patch });
</script>

<fieldset class="customField" style="border: 0; margin: 0; padding: 0">
    <Input aria-label="名称" aria-required={ariaRequired} onChange={(name) => update({ name })} style="width: 180px; margin-inline-end: 12px" value={value?.name}>
        {#snippet prefix()}名称{/snippet}
    </Input>
    <Select aria-label="角色" aria-required={ariaRequired} onChange={(role) => update({ role: role as string })} optionList={roles} style="width: 200px" value={value?.role}>
        {#snippet prefix()}角色{/snippet}
    </Select>
</fieldset>
