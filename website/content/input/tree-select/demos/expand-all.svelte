<script lang="ts">
    import { onMount } from 'svelte';
    import { TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    const source: TreeNodeData[] = [
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
    const firstStyle = 'width: 300px; margin-bottom: 20px';
    const secondStyle = 'width: 300px';
    let data = $state.raw<TreeNodeData[]>([]);

    onMount(() => {
        const timer = setTimeout(() => {
            data = source;
        }, 500);
        return () => clearTimeout(timer);
    });
</script>

<TreeSelect expandAll placeholder="expandAll" style={firstStyle} treeData={data} />
<TreeSelect defaultExpandAll placeholder="defaultExpandAll" style={secondStyle} treeData={data} />
