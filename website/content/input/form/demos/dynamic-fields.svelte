<script lang="ts">
    import { Button, Form, FormInput, FormRadio, FormRadioGroup } from '@fibrae/semi-ui-svelte';
</script>

<Form style="width: 450px">
    {#snippet children({ formState })}
        <FormInput field="name" label="用户名称:" />
        <FormRadioGroup field="isAnchor" label="是否已注册主播">
            <FormRadio value="yes">yes</FormRadio>
            <FormRadio value="no">no</FormRadio>
        </FormRadioGroup>
        {#if formState.values?.isAnchor === 'yes'}
            <FormInput field="liveRoom" label="直播间名称" />
        {/if}
        <Button htmlType="submit">提交</Button>
    {/snippet}
</Form>
