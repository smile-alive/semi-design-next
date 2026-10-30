<script lang="ts">
    import { Switch, TreeSelect, type TreeNodeData } from '@fibrae/semi-ui-svelte';

    let showFilteredOnly = $state(false);

    const treeData: TreeNodeData[] = [
        {
            label: 'Asia',
            value: 'Asia',
            key: '0',
            children: [
                {
                    label: 'China',
                    value: 'China',
                    key: '0-0',
                    children: [
                        { label: 'Beijing', value: 'Beijing', key: '0-0-0' },
                        { label: 'Shanghai', value: 'Shanghai', key: '0-0-1' },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0' }],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                { label: 'United States', value: 'United States', key: '1-0' },
                { label: 'Canada', value: 'Canada', key: '1-1' },
            ],
        },
    ];

    const dropdownStyle = 'max-height: 400px; overflow: auto';

    const onSearch = (input: string, filteredExpandedKeys: string[], filteredNodes: TreeNodeData[]) => {
        console.log('onSearch', input, filteredExpandedKeys, filteredNodes);
    };
</script>

<span id="treeselect-searchable-filtered-only">showFilteredOnly</span>
<Switch aria-labelledby="treeselect-searchable-filtered-only" bind:checked={showFilteredOnly} size="small" />
<br />
<br />
<TreeSelect {dropdownStyle} filterTreeNode {onSearch} placeholder="单选可搜索的" {showFilteredOnly} style="width: 300px" {treeData} />
<br />
<br />
<TreeSelect {dropdownStyle} filterTreeNode maxTagCount={2} multiple {onSearch} placeholder="多选可搜索的" searchPlaceholder="请输入关键字开始搜索" {showFilteredOnly} style="width: 300px" {treeData} />
<br />
<br />
<TreeSelect {dropdownStyle} filterTreeNode maxTagCount={2} multiple {onSearch} placeholder="搜索框autofocus" searchAutoFocus searchPlaceholder="autofocus" {showFilteredOnly} style="width: 300px" {treeData} />
