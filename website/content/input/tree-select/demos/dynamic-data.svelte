<script lang="ts">
    import { Button, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    const style = 'width: 300px';
    const dropdownStyle = 'max-height: 400px; overflow: auto';
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

<TreeSelect {dropdownStyle} placeholder="请选择" {style} {treeData} />
<br />
<br />
<Button onclick={add}>动态改变数据</Button>
