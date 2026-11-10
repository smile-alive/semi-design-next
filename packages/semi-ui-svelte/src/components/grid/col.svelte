<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/grid/constants';
    import { getColClassName } from '@fibrae/semi-foundation/components/grid/utils';
    import '@fibrae/semi-foundation/components/grid/grid.scss';
    import useDefaultProps from '../../base/use-default-props.js';
    import type { ColProps } from './interface.js';

    const defaults = useDefaultProps('Col');
    let { span = defaults('span'), order = defaults('order'), offset = defaults('offset'), push = defaults('push'), pull = defaults('pull'), xs = defaults('xs'), sm = defaults('sm'), md = defaults('md'), lg = defaults('lg'), xl = defaults('xl'), xxl = defaults('xxl'), children, ...rest }: ColProps = $props();

    const prefixCls = cssClasses.PREFIX;
</script>

<div {...rest} class={[getColClassName(prefixCls, { span, order, offset, push, pull, xs, sm, md, lg, xl, xxl }), rest.class]} x-semi-prop="children">
    {@render children?.()}
</div>
