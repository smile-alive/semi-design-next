<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const data = [
        {
            label: 'Asia',
            children: [
                { value: 'a-1', label: 'China' },
                { value: 'a-2', label: 'Korea' },
            ],
        },
        {
            label: 'Europe',
            children: [
                { value: 'b-1', label: 'Germany' },
                { value: 'b-2', label: 'France' },
            ],
        },
        {
            label: 'South America',
            children: [{ value: 'c-1', label: 'Peru' }],
        },
    ];

    const optionList = data.flatMap(({ label, children }) => children.map((option) => ({ ...option, group: { key: label, label } })));
</script>

<Select aria-label="地区" filter {optionList} placeholder="" style="width: 180px">
    {#snippet groupLabel({ group })}
        <strong>{group.label}</strong>
    {/snippet}
</Select>
