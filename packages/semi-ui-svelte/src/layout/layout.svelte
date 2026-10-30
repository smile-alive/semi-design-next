<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/layout/constants';
    import '@fibrae/semi-foundation/layout/layout.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import { setLayoutContext } from './context.js';
    import type { LayoutProps } from './interface.js';

    const defaults = useDefaultProps('Layout');
    let { prefixCls = defaults('prefixCls', cssClasses.PREFIX), tagName = defaults('tagName', 'section'), hasSider = defaults('hasSider'), children, ...rest }: LayoutProps = $props();

    // Siders register while they mount, so one nested deeper than a direct child still counts. Known limit: the server
    // renders the root before its children, so a Sider is only counted after hydration unless `hasSider` is set.
    // Upgrade: style the class with `:has(> .semi-layout-sider)` instead.
    let siderCount = $state(0);

    setLayoutContext({
        addSider: () => {
            siderCount++;
        },
        removeSider: () => {
            siderCount--;
        },
    });
</script>

<svelte:element this={tagName} {...rest} class={[prefixCls, rest.class, { [`${prefixCls}-has-sider`]: hasSider === true || siderCount > 0 }]}>
    {@render children?.()}
</svelte:element>
