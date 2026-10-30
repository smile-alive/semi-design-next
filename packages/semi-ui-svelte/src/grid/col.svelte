<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/grid/constants';
    import { getColClassName } from '@fibrae/semi-foundation/grid/utils';
    import '@fibrae/semi-foundation/grid/grid.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { ColProps } from './interface.js';

    const defaults = useDefaultProps('Col');

    let {
        prefixCls = defaults('prefixCls', cssClasses.PREFIX),
        span = defaults('span'),
        order = defaults('order'),
        offset = defaults('offset'),
        push = defaults('push'),
        pull = defaults('pull'),
        xs = defaults('xs'),
        sm = defaults('sm'),
        md = defaults('md'),
        lg = defaults('lg'),
        xl = defaults('xl'),
        xxl = defaults('xxl'),
        children,
        ...rest
    }: ColProps = $props();
</script>

<div {...rest} class={[getColClassName(prefixCls, { span, order, offset, push, pull, xs, sm, md, lg, xl, xxl }), rest.class]} x-semi-prop="children">
    {@render children?.()}
</div>
