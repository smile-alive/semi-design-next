<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte/select/index';
    import type { SlotViewProps } from './node-view.svelte.js';

    let { node, updateAttributes }: SlotViewProps = $props();

    const value = $derived((node.attrs.value as string | null) ?? '');
    const optionList = $derived((JSON.parse((node.attrs.options as string) || '[]') as string[]).map((option) => ({ value: option, label: option })));

    const handleChange = (next: unknown) => {
        if (typeof next === 'string') {
            updateAttributes({ value: next });
        }
    };
</script>

<span class="select-slot-wrapper">
    <Select class="select-slot" onChange={handleChange} {optionList} {value} />
</span>
