<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import type { ButtonProps } from '@fibrae/semi-ui-svelte/button/interface';

    let { active = false, class: className, ...rest }: ButtonProps & { active?: boolean } = $props();

    const prefix = cssClasses.FILE;
</script>

<Button {...rest} class={[`${prefix}-menu-bar-btn`, { [`${prefix}-menu-bar-btn-active`]: active }, className]} theme="borderless" type="tertiary" />
