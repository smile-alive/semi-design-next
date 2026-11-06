<script lang="ts">
    import { List } from '@fibrae/semi-ui-svelte';

    const data = ['从明天起，做一个幸福的人', '喂马，劈柴，周游世界', '从明天起，关心粮食和蔬菜', '我有一所房子，面朝大海，春暖花开'];
</script>

<div>
    <div style="margin-inline-end: 16px">
        <h3 style="margin-block-end: 16px">Default Size</h3>
        <List bordered dataSource={data}>
            {#snippet header()}
                <div>Header</div>
            {/snippet}
            {#snippet footer()}
                <div>Footer</div>
            {/snippet}
            {#snippet item(row)}
                <List.Item>{row.item}</List.Item>
            {/snippet}
        </List>
    </div>
    <div style="margin-inline-end: 16px">
        <h3 style="margin: 16px 0">Small Size</h3>
        <List bordered dataSource={data} size="small">
            {#snippet header()}
                <div>Header</div>
            {/snippet}
            {#snippet footer()}
                <div>Footer</div>
            {/snippet}
            {#snippet item(row)}
                <List.Item>{row.item}</List.Item>
            {/snippet}
        </List>
    </div>
    <div style="margin-inline-end: 16px">
        <h3 style="margin: 16px 0">Large Size</h3>
        <List bordered dataSource={data} size="large">
            {#snippet header()}
                <div>Header</div>
            {/snippet}
            {#snippet footer()}
                <div>Footer</div>
            {/snippet}
            {#snippet item(row)}
                <List.Item>{row.item}</List.Item>
            {/snippet}
        </List>
    </div>
</div>
