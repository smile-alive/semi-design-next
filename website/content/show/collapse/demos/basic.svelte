<script lang="ts">
    import { Collapse } from '@fibrae/semi-ui-svelte';
</script>

<Collapse>
    <Collapse.Panel itemKey="1">
        {#snippet header()}This is panel header 1{/snippet}
        <p>Hi, this is the docsite of Semi Design Next.</p>
    </Collapse.Panel>
    <Collapse.Panel itemKey="2">
        {#snippet header()}This is panel header 2{/snippet}
        <p>Hi, this is the docsite of Semi Design Next.</p>
    </Collapse.Panel>
    <Collapse.Panel itemKey="3">
        {#snippet header()}This is panel header 3{/snippet}
        <p>Hi, this is the docsite of Semi Design Next.</p>
    </Collapse.Panel>
</Collapse>
