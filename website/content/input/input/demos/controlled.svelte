<script lang="ts">
    import { Input } from '@fibrae/semi-ui-svelte';

    let value = $state('controlInput');

    const onChange = (val: string) => {
        console.log(val);
    };
</script>

<Input aria-label="Controlled input" bind:value {onChange} />
