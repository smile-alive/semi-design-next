<script lang="ts">
    import type { ComponentProps } from 'svelte';
    import { IconLink } from '@fibrae/semi-icons-svelte';
    import { FormInput } from '@fibrae/semi-ui-svelte';

    let props: ComponentProps<typeof FormInput> = $props();
</script>

{#snippet prefix()}
    <IconLink />
{/snippet}

<FormInput {...props} placeholder="https://" {prefix} />
