<script lang="ts">
    import { onMount } from 'svelte';
    import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

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
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
            key: '1',
        },
    ];
    let data = $state.raw<TreeNodeData[]>([]);

    onMount(() => {
        const timer = setTimeout(() => {
            data = treeData;
        }, 500);
        return () => clearTimeout(timer);
    });
</script>

<TreeSelect expandAll placeholder="expandAll" style="width: 300px; margin-bottom: 20px" treeData={data} />
<TreeSelect defaultExpandAll placeholder="defaultExpandAll" style="width: 300px" treeData={data} />
