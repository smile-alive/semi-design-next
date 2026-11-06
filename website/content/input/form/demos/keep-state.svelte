<script lang="ts">
    import { Button, Form, FormInput, FormSwitch, Switch } from '@fibrae/semi-ui-svelte';

    let show = $state(true);
</script>

<Form style="width: 450px">
    <FormSwitch field="alwaysShow" label="始终显示的字段" />
    <Switch aria-labelledby="form-keep-state-toggle" bind:checked={show} style="margin-block-end: 12px" />
    <span id="form-keep-state-toggle" style="margin-inline-start: 8px; color: var(--semi-color-text-2)"> 显示条件字段 </span>
    {#if show}
        <FormInput field="kept" label="条件字段（默认保留状态）" rules={[{ required: true, message: '必填' }]} />
        <FormInput field="reset" initValue="初始值" keepState={false} label={'条件字段（keepState={false}）'} />
    {/if}
    <Button htmlType="submit">提交</Button>
</Form>
