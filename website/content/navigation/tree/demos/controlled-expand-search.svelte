<script lang="ts">
    import { Tree } from '@fibrae/semi-ui-svelte';

    let expandedKeys = $state<string[]>([]);
    const treeData = [
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

    const handleSearch = (_inputValue: string, filteredExpandedKeys: string[]) => {
        expandedKeys = [...filteredExpandedKeys];
    };
</script>

<Tree bind:expandedKeys filterTreeNode onSearch={handleSearch} style="width: 300px" {treeData} />
