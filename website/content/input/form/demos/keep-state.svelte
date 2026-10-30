<script lang="ts">
    import { Button, Form, FormInput, FormSwitch, Switch } from '@fibrae/semi-ui-svelte';

    let show = $state(true);
</script>

<Form style="width: 450px">
    <FormSwitch field="alwaysShow" label="始终显示的字段" />
    <Switch aria-labelledby="form-keep-state-toggle" bind:checked={show} style="margin-bottom: 12px" />
    <span id="form-keep-state-toggle" style="margin-left: 8px; color: var(--semi-color-text-2)"> 显示条件字段 </span>
    {#if show}
        <FormInput field="conditionalField" keepState label="条件字段（keepState）" />
        <FormInput field="noKeepState" label="条件字段（无 keepState）" />
    {/if}
    <Button htmlType="submit">提交</Button>
</Form>
