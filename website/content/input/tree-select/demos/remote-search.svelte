<script lang="ts">
    import { TreeSelect, type TreeNodeData, type TreeSelectValue } from '@fibrae/semi-ui-svelte';

    let value = $state<TreeSelectValue | undefined>();
    let treeData = $state.raw<TreeNodeData[]>([]);

    const onSearch = (input: string) => {
        if (!input) {
            treeData = [];
            return;
        }

        setTimeout(() => {
            treeData = [
                { label: `${input} - 结果1`, value: `${input}-1`, key: `${input}-1` },
                { label: `${input} - 结果2`, value: `${input}-2`, key: `${input}-2` },
                { label: `${input} - 结果3`, value: `${input}-3`, key: `${input}-3` },
            ];
        }, 500);
    };
</script>

<TreeSelect bind:value filterTreeNode {onSearch} placeholder="请输入关键字进行远程搜索" remote style="width: 300px" {treeData} />
