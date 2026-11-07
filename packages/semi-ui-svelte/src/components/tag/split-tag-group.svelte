<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/tag/constants';
    import '@fibrae/semi-foundation/components/tag/tag.scss';
    import type { SplitTagGroupProps } from './interface.js';

    let { children, ...rest }: SplitTagGroupProps = $props();
</script>

<div {...rest} class={[`${cssClasses.PREFIX}-split`, rest.class]} role="group">
    {@render children?.()}
</div>
