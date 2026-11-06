<script lang="ts">
    import { Input, Select } from '@fibrae/semi-ui-svelte';

    interface BaseInfo {
        name?: string;
        role?: string;
    }

    // id and aria-labelledby go on the fieldset (named by the field label); aria-required goes to each control
    let { id, value, onChange, 'aria-labelledby': labelledBy, 'aria-required': ariaRequired }: { id?: string; value?: BaseInfo; onChange?: (value: BaseInfo) => void; 'aria-labelledby'?: string; 'aria-required'?: boolean | 'true' | 'false' } = $props();

    const roles = [
        { value: 'rd', label: '开发' },
        { value: 'UED', label: '设计师' },
    ];

    const update = (patch: BaseInfo) => onChange?.({ ...value, ...patch });
</script>

<fieldset aria-labelledby={labelledBy} class="customField" {id} style="border: 0; margin: 0; padding: 0">
    <Input aria-label="名称" aria-required={ariaRequired} onChange={(name) => update({ name })} style="width: 180px; margin-inline-end: 12px" value={value?.name}>
        {#snippet prefix()}名称{/snippet}
    </Input>
    <Select aria-label="角色" aria-required={ariaRequired} onChange={(role) => update({ role: role as string })} optionList={roles} style="width: 200px" value={value?.role}>
        {#snippet prefix()}角色{/snippet}
    </Select>
</fieldset>
