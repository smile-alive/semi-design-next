<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/card/constants';
    import { namedRole } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/card/card.scss';
    import { useDefaultProps } from '../../base/index.js';
    import { Skeleton, SkeletonParagraph, SkeletonTitle } from '../skeleton/index.js';
    import Space from '../space/space.svelte';
    import { TypographyTitle } from '../typography/index.js';
    import type { CardProps } from './interface.js';

    const defaults = useDefaultProps('Card');

    let {
        bordered = defaults('bordered', true),
        classNames = defaults('classNames'),
        footerLine = defaults('footerLine', false),
        headerLine = defaults('headerLine', true),
        loading = defaults('loading', false),
        shadows = defaults('shadows'),
        styles = defaults('styles'),
        title,
        headerExtraContent,
        header,
        cover,
        actions,
        footer,
        children,
        ...rest
    }: CardProps = $props();

    const prefixCls = cssClasses.PREFIX;
    const hasTitle = $derived(typeof title === 'function' || Boolean(title));
</script>

<div
    {...rest}
    aria-busy={loading ? 'true' : 'false'}
    class={[
        prefixCls,
        rest.class,
        {
            [`${prefixCls}-bordered`]: bordered,
            [`${prefixCls}-shadows`]: shadows,
            [`${prefixCls}-shadows-${shadows}`]: shadows,
        },
    ]}
    role={namedRole(rest)}
>
    {#if header || headerExtraContent || hasTitle}
        <div class={[`${prefixCls}-header`, { [`${prefixCls}-header-bordered`]: headerLine }, classNames?.header]} style={styles?.header}>
            {#if header}
                {@render header()}
            {:else}
                <div class={`${prefixCls}-header-wrapper`}>
                    {#if hasTitle}
                        <div class={[`${prefixCls}-header-wrapper-title`, { [`${prefixCls}-header-wrapper-spacing`]: headerExtraContent }, classNames?.title]} style={styles?.title}>
                            {#if typeof title === 'function'}
                                {@render title()}
                            {:else}
                                <!-- a div: a heading here would break the page outline -->
                                <TypographyTitle component="div" ellipsis={{ showTooltip: true, rows: 1 }} heading={6} x-semi-prop="title">{title}</TypographyTitle>
                            {/if}
                        </div>
                    {/if}
                    {#if headerExtraContent}
                        <div class={[`${prefixCls}-header-wrapper-extra`, classNames?.extra]} style={styles?.extra} x-semi-prop="headerExtraContent">{@render headerExtraContent()}</div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
    {#if cover}
        <div class={[`${prefixCls}-cover`, classNames?.cover]} style={styles?.cover} x-semi-prop="cover">{@render cover()}</div>
    {/if}
    <div class={[`${prefixCls}-body`, classNames?.body]} style={styles?.body}>
        {#if children}
            <Skeleton active {loading}>
                {#snippet placeholder()}
                    <div>
                        <SkeletonTitle />
                        <br />
                        <SkeletonParagraph rows={3} />
                    </div>
                {/snippet}
                {@render children()}
            </Skeleton>
        {/if}
        {#if actions?.length}
            <div class={[`${prefixCls}-body-actions`, classNames?.actions]} style={styles?.actions}>
                <Space spacing={12}>
                    {#each actions as action, index (index)}
                        <div class={`${prefixCls}-body-actions-item`} x-semi-prop={`actions.${index}`}>{@render action()}</div>
                    {/each}
                </Space>
            </div>
        {/if}
    </div>
    {#if footer}
        <div class={[`${prefixCls}-footer`, { [`${prefixCls}-footer-bordered`]: footerLine }, classNames?.footer]} style={styles?.footer} x-semi-prop="footer">{@render footer()}</div>
    {/if}
</div>
