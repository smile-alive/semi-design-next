<script lang="ts">
    import { Button, Select } from '@fibrae/semi-ui-svelte';

    let options = $state([1, 2, 3, 4]);

    const optionList = $derived(options.map((option) => ({ value: option, label: String(option) })));

    const add = () => {
        const length = Math.ceil(Math.random() * 10);
        options = Array.from({ length }, (_, i) => i + 1);
    };
</script>

<Select aria-label="数字" {optionList} placeholder="请选择" style="width: 180px" value={4} />
<br />
<br />
<Button onclick={add}>changeOptions Dynamic</Button>
