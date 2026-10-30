<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/card/constants';
    import '@fibrae/semi-foundation/card/card.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import { Skeleton, SkeletonParagraph, SkeletonTitle } from '../skeleton/index.js';
    import Space from '../space/space.svelte';
    import { TypographyTitle } from '../typography/index.js';
    import type { CardProps } from './interface.js';

    const defaults = useDefaultProps('Card');

    let {
        bodyStyle = defaults('bodyStyle'),
        bordered = defaults('bordered', true),
        footerLine = defaults('footerLine', false),
        footerStyle = defaults('footerStyle'),
        headerLine = defaults('headerLine', true),
        headerStyle = defaults('headerStyle'),
        loading = defaults('loading', false),
        shadows = defaults('shadows'),
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
    role={groupRole(rest)}
>
    {#if header || headerExtraContent || hasTitle}
        <div class={[`${prefixCls}-header`, { [`${prefixCls}-header-bordered`]: headerLine }]} style={headerStyle}>
            {#if header}
                {@render header()}
            {:else}
                <div class={`${prefixCls}-header-wrapper`}>
                    {#if hasTitle}
                        <div class={[`${prefixCls}-header-wrapper-title`, { [`${prefixCls}-header-wrapper-spacing`]: headerExtraContent }]}>
                            {#if typeof title === 'function'}
                                {@render title()}
                            {:else}
                                <!-- a div: a heading here would break the page outline -->
                                <TypographyTitle component="div" ellipsis={{ showTooltip: true, rows: 1 }} heading={6} x-semi-prop="title">{title}</TypographyTitle>
                            {/if}
                        </div>
                    {/if}
                    {#if headerExtraContent}
                        <div class={`${prefixCls}-header-wrapper-extra`} x-semi-prop="headerExtraContent">{@render headerExtraContent()}</div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
    {#if cover}
        <div class={`${prefixCls}-cover`} x-semi-prop="cover">{@render cover()}</div>
    {/if}
    <div class={`${prefixCls}-body`} style={bodyStyle}>
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
            <div class={`${prefixCls}-body-actions`}>
                <Space spacing={12}>
                    {#each actions as action, index (index)}
                        <div class={`${prefixCls}-body-actions-item`} x-semi-prop={`actions.${index}`}>{@render action()}</div>
                    {/each}
                </Space>
            </div>
        {/if}
    </div>
    {#if footer}
        <div class={[`${prefixCls}-footer`, { [`${prefixCls}-footer-bordered`]: footerLine }]} style={footerStyle} x-semi-prop="footer">{@render footer()}</div>
    {/if}
</div>
