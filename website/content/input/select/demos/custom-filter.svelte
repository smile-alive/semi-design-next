<script lang="ts">
    import { Select, type SelectOptionProps } from '@fibrae/semi-ui-svelte';

    const optionList = [
        { value: 'video', label: 'video' },
        { value: 'camera', label: 'LIVE' },
        { value: 'editing', label: 'COMMUNITY' },
        { value: 'movie', label: 'MOVIE' },
    ];

    const searchLabel = (sugInput: string, option: SelectOptionProps) => {
        const label = String(option.label).toUpperCase();
        const sug = sugInput.toUpperCase();
        return label.includes(sug);
    };
</script>

<Select aria-label="业务线" filter={searchLabel} {optionList} placeholder="try video" style="width: 180px" />
