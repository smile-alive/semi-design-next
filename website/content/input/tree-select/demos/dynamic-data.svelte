<script lang="ts">
    import { Button, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    // Only a new array updates the options, so the list is replaced as a whole.
    let treeData = $state.raw<TreeNodeData[]>([]);

    const add = () => {
        const itemLength = Math.floor(Math.random() * 5) + 1;
        treeData = Array.from({ length: itemLength }, (_, i) => {
            const length = Math.floor(Math.random() * 3);
            const children = Array.from({ length }, (_, ci) => ({
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

<TreeSelect dropdownStyle="max-height: 400px; overflow: auto" placeholder="请选择" style="width: 300px" {treeData} />
<br />
<br />
<Button onclick={add}>动态改变数据</Button>
