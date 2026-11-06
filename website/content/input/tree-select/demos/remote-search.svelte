<script lang="ts">
    import { TreeSelect, type TreeNodeData, type TreeSelectValue } from '@fibrae/semi-ui-svelte';

    let value = $state<TreeSelectValue | undefined>();
    let treeData = $state.raw<TreeNodeData[]>([]);

    let latestInput = '';

    const handleSearch = (inputValue: string) => {
        latestInput = inputValue;
        if (!inputValue) {
            treeData = [];
            return;
        }

        setTimeout(() => {
            if (latestInput !== inputValue) {
                return;
            }
            const mockData = [
                { label: `${inputValue} - 结果1`, value: `${inputValue}-1`, key: `${inputValue}-1` },
                { label: `${inputValue} - 结果2`, value: `${inputValue}-2`, key: `${inputValue}-2` },
                { label: `${inputValue} - 结果3`, value: `${inputValue}-3`, key: `${inputValue}-3` },
            ];
            treeData = mockData;
        }, 500);
    };
</script>

<TreeSelect bind:value filterTreeNode onSearch={handleSearch} placeholder="请输入关键字进行远程搜索" remote style="width: 300px" {treeData} />
