<script lang="ts">
    import { Button, Tree, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    const style = 'width: 260px; height: 420px; border: 1px solid var(--semi-color-border)';

    let treeData = $state.raw<TreeNodeData[]>([
        {
            key: '0',
            label: 'item-0',
            value: '0',
        },
    ]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        treeData = Array.from({ length: itemLength }).map((_, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }).map((_, ci) => ({
                key: `${i}-${ci}`,
                label: `Leaf-${i}-${ci}`,
                value: `${i}-${ci}`,
            }));
            return {
                key: `${i}`,
                label: `Item-${i}`,
                value: `${i}`,
                children,
            };
        });
    };
</script>

<div {style}>
    <Tree {treeData} />
    <br />
    <Button style="margin: 20px" onclick={add}>动态改变数据</Button>
</div>
