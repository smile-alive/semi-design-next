<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import '@fibrae/semi-foundation/typography/typography.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { TypographyProps } from './interface.js';

    const defaults = useDefaultProps('Typography');
    const { component = defaults('component', 'article'), children, ...rest }: TypographyProps = $props();
</script>

<svelte:element this={component} {...rest} class={[cssClasses.PREFIX, rest.class]}>
    {@render children?.()}
</svelte:element>
