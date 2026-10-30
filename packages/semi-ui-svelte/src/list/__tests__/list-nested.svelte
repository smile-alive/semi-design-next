<script lang="ts">
    import { List, ListItem } from '../index';

    let { onInner, onOuter }: { onInner: () => void; onOuter: (event: MouseEvent) => void } = $props();
</script>

<List>
    <ListItem onClick={onOuter}>
        {#snippet main()}outer{/snippet}
        {#snippet extra()}
            <List>
                <ListItem>
                    {#snippet main()}inner{/snippet}
                    {#snippet extra()}<button type="button" onclick={onInner}>InnerAct</button>{/snippet}
                </ListItem>
            </List>
        {/snippet}
    </ListItem>
</List>
