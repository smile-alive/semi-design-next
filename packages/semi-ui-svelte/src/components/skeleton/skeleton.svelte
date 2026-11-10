<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/skeleton/constants';
    import '@fibrae/semi-foundation/components/skeleton/skeleton.scss';
    import { useDefaultProps } from '../../base/index.js';
    import type { SkeletonProps } from './interface.js';

    const defaults = useDefaultProps('Skeleton');
    let { loading = defaults('loading', true), active = defaults('active'), placeholder, children, ...rest }: SkeletonProps = $props();

    const prefixCls = cssClasses.PREFIX;
</script>

<!-- The root is absent once loading ends, so rest goes with the placeholder -->
{#if loading}
    <div {...rest} aria-busy="true" class={[prefixCls, rest.class, { [`${prefixCls}-active`]: active }]} x-semi-prop="placeholder">
        {@render placeholder?.()}
    </div>
{:else}
    {@render children?.()}
{/if}
