<script lang="ts">
    import TypographyBase from './base.svelte';
    import type { TypographyTextProps } from './interface.js';

    // A static subcomponent: it reads no global defaults, as in React.
    const props: TypographyTextProps = $props();
</script>

<TypographyBase {...props} component={props.component ?? 'span'} />
