<script lang="ts">
    import InputGroup from '../input-group.svelte';
    import Input from '../input.svelte';
</script>

<InputGroup class="g" label={{ text: 'Score' }} labelPosition="top" style="color: red">
    <Input placeholder="score" />
</InputGroup>
<InputGroup labelPosition="left">
    {#snippet fieldLabel()}Slot label{/snippet}
    {#snippet labelExtra()}extra{/snippet}
    <Input placeholder="slot" />
</InputGroup>
<InputGroup label={{ text: 'Named', name: 'named', id: 'named-label' }}>
    <Input placeholder="named" />
</InputGroup>
