<script lang="ts">
    import { Select, type SelectOptionProps } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'douyin', label: 'douyin' },
        { value: 'ulikecam', label: 'HOTSOON' },
        { value: 'jianying', label: 'PIPIXIA' },
        { value: 'xigua', label: 'XIGUA' },
    ];

    const searchLabel = (sugInput: string, option: SelectOptionProps) => {
        const label = String(option.label).toUpperCase();
        const sug = sugInput.toUpperCase();
        return label.includes(sug);
    };
</script>

<Select aria-label="业务线" filter={searchLabel} {optionList} placeholder="try douyin" style="width: 180px" />
