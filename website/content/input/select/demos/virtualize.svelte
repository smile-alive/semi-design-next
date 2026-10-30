<script lang="ts">
    import { Select } from '@fibrae/semi-ui-svelte';

    const options = Array.from({ length: 3000 }, (_, i) => ({ label: `option-${i}`, value: i }));
    const virtualize = {
        height: 270,
        width: '100%',
        itemSize: 36,
    };
</script>

<Select aria-label="virtualize" filter optionList={options} placeholder="拥有3k个Option的Select" style="width: 260px" {virtualize} />
