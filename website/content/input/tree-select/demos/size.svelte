<script lang="ts">
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
                        { label: '北京', value: 'Beijing', key: '0-0-0' },
                        { label: '上海', value: 'Shanghai', key: '0-0-1' },
                    ],
                },
            ],
        },
        { label: '北美洲', value: 'North America', key: '1' },
    ];
</script>

<div>
    <TreeSelect dropdownStyle="max-height: 400px; overflow: auto" multiple placeholder="small" size="small" style="width: 300px" {treeData} />
    <br />
    <br />
    <TreeSelect dropdownStyle="max-height: 400px; overflow: auto" multiple placeholder="default" size="default" style="width: 300px" {treeData} />
    <br />
    <br />
    <TreeSelect dropdownStyle="max-height: 400px; overflow: auto" multiple placeholder="large" size="large" style="width: 300px" {treeData} />
</div>
