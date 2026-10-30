<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/card/constants';
    import '@fibrae/semi-foundation/card/card.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import Space from '../space/space.svelte';
    import type { CardGroupProps } from './interface.js';

    const defaults = useDefaultProps('CardGroup');
    let { spacing = defaults('spacing', 16), type = defaults('type'), align = defaults('align'), vertical = defaults('vertical', false), wrap = defaults('wrap', true), children, ...rest }: CardGroupProps = $props();

    const prefixCls = cssClasses.PREFIX;
    const isGrid = $derived(type === 'grid');
</script>

<Space {...rest} {align} class={[`${prefixCls}-group`, rest.class, { [`${prefixCls}-group-grid`]: isGrid }]} spacing={isGrid ? 0 : spacing} {vertical} {wrap}>
    {@render children?.()}
</Space>
