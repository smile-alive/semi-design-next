<script lang="ts">
    import { Transfer, type TransferTreeItem, type TransferValue } from '@fibrae/semi-ui-svelte';

    const treeData: TransferTreeItem[] = [
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
                        { label: 'Beijing', value: 'Beijing', key: '0-0-0', children: [] },
                        { label: 'Shanghai', value: 'Shanghai', key: '0-0-1', children: [] },
                        { label: 'Chengdu', value: 'Chengdu', key: '0-0-2', children: [] },
                    ],
                },
                {
                    label: 'Japan',
                    value: 'Japan',
                    key: '0-1',
                    children: [{ label: 'Osaka', value: 'Osaka', key: '0-1-0', children: [] }],
                },
            ],
        },
        {
            label: 'North America',
            value: 'North America',
            key: '1',
            children: [
                { label: 'United States', value: 'United States', key: '1-0', children: [] },
                { label: 'Canada', value: 'Canada', key: '1-1', children: [] },
                { label: 'Mexico', value: 'Mexico', disabled: true, key: '1-2', children: [] },
                { label: 'Cuba', value: 'Cuba', key: '1-3', children: [] },
            ],
        },
    ];

    let value = $state<TransferValue>(['Shanghai']);
</script>

<div style="margin: 10px; padding: 10px; width: 600px">
    <Transfer bind:value dataSource={treeData} type="treeList" />
</div>
