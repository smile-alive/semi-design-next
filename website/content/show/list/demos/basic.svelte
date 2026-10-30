<script lang="ts">
    import { List, ListItem } from '@fibrae/semi-ui-svelte';

    const data = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];
    const sizes = [
        { title: 'Default Size', size: undefined, margin: '0 0 16px' },
        { title: 'Small Size', size: 'small', margin: '16px 0' },
        { title: 'Large Size', size: 'large', margin: '16px 0' },
    ] as const;
</script>

<div>
    {#each sizes as { title, size, margin } (title)}
        <div style="margin-right: 16px">
            <h3 style="margin: {margin}">{title}</h3>
            <List bordered dataSource={data} {size}>
                {#snippet header()}
                    <div>Header</div>
                {/snippet}
                {#snippet footer()}
                    <div>Footer</div>
                {/snippet}
                {#snippet item({ item: text })}
                    <ListItem>{text}</ListItem>
                {/snippet}
            </List>
        </div>
    {/each}
</div>
