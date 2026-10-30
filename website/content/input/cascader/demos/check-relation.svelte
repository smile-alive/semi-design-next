<script lang="ts">
    import { Cascader, type CascaderValue } from '@fibrae/semi-ui-svelte';

    let value = $state<CascaderValue>([['Asia'], ['Asia', 'China', 'Beijing']]);

    const treeData = [
        {
            label: '亚洲',
            value: 'Asia',
            children: [
                {
                    label: '中国',
                    value: 'China',
                    children: [
                        { label: '北京', value: 'Beijing' },
                        { label: '上海', value: 'Shanghai' },
                    ],
                },
            ],
        },
        {
            label: '北美洲',
            value: 'North America',
        },
    ];
</script>

<Cascader bind:value checkRelation="unRelated" multiple style="width: 300px" {treeData} />
