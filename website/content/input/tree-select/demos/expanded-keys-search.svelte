<script lang="ts">
    import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    let expandedKeys = $state<string[]>([]);
    const treeData: TreeNodeData[] = [
        {
            label: '亚洲',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: '中国',
                    value: 'China',
                    key: '0-0',
                    children: [
                        {
                            label: '北京',
                            value: 'Beijing',
                            key: '0-0-0',
                        },
                        {
                            label: '上海',
                            value: 'Shanghai',
                            key: '0-0-1',
                        },
                    ],
                },
                {
                    label: '日本',
                    value: 'Japan',
                    key: '0-1',
                },
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
            key: '1',
        },
    ];

    const onSearch = (_input: string, filteredExpandedKeys: string[]) => {
        expandedKeys = [...filteredExpandedKeys, ...expandedKeys];
    };
</script>

<TreeSelect bind:expandedKeys dropdownStyle="max-height: 400px; overflow: auto" filterTreeNode {onSearch} style="width: 300px" {treeData} />
