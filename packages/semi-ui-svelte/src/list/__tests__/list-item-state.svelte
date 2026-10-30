<script lang="ts">
    import { List, ListItem } from '../index';

    let header = $state(false);
</script>

<button type="button" onclick={() => (header = !header)}>toggle</button>
<List>
    <ListItem header={header ? head : undefined}>
        <input aria-label="state" />
    </ListItem>
</List>

{#snippet head()}head{/snippet}
