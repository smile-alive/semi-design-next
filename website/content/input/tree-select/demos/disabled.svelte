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
    const style = 'width: 300px';
    const dropdownStyle = 'max-height: 400px; overflow: auto';
</script>

<div>
    <TreeSelect disabled {dropdownStyle} placeholder="禁用下拉菜单" {style} {treeData} />
    <br />
    <br />
    <TreeSelect disabled {dropdownStyle} {style} {treeData} value="Shanghai" />
    <br />
    <br />
    <TreeSelect disabled {dropdownStyle} multiple {style} {treeData} value={['Shanghai', 'North America']} />
</div>
