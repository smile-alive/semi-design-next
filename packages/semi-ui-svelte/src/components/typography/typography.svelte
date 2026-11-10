<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/typography/constants';
    import '@fibrae/semi-foundation/components/typography/typography.scss';
    import { useDefaultProps } from '../../base/index.js';
    import type { TypographyProps } from './interface.js';

    const defaults = useDefaultProps('Typography');
    const { component = defaults('component', 'article'), children, ...rest }: TypographyProps = $props();
</script>

<svelte:element this={component} {...rest} class={[cssClasses.PREFIX, rest.class]}>
    {@render children?.()}
</svelte:element>
