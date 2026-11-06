<script lang="ts">
    import { Form, FormInput, FormSlot } from '@fibrae/semi-ui-svelte';
</script>

<Form labelPosition="left" labelWidth={100} onChange={(v) => console.log(v)} onSubmit={(v) => console.log(v)} style="width: 600px">
    <FormInput field="特效名称" style="width: 250px" />
    <FormSlot error={['我是SlotA的ErrorMessage']} label={{ text: 'SlotA' }}>
        <div style="display: flex; align-items: center; height: 32px; margin-block-start: 8px">我是Semi Form SlotA, 我是自定义的节点</div>
    </FormSlot>
    <FormSlot label={{ text: 'SlotB', width: 160, align: 'right' }}>
        <div style="display: flex; align-items: center; height: 100%">我是Semi Form SlotB, 我的Label Align、Width与众不同</div>
    </FormSlot>
</Form>
