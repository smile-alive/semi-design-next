<script lang="ts">
    import type { Attachment } from 'svelte/attachments';
    import { omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/components/image/constants';
    import ImageFoundation, { type ImageAdapter, type ImageState } from '@fibrae/semi-foundation/components/image/image-foundation';
    import { loadLazyImages } from '@fibrae/semi-foundation/components/image/preview-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils';
    import '@fibrae/semi-foundation/components/image/image.scss';
    import { IconUploadError } from '@fibrae/semi-icons-svelte';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { splitControlAttrs } from '../../utils/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { SkeletonImage } from '../skeleton/index.js';
    import { getPreviewContext } from './context.js';
    import type { ImageProps } from './interface.js';
    import PreviewInner from './preview/preview-inner.svelte';

    type Foundation = ImageFoundation<ImageProps>;
    type Adapter = ImageAdapter<ImageProps>;

    const defaults = useDefaultProps('Image');

    let {
        src = defaults('src'),
        width = defaults('width'),
        height = defaults('height'),
        alt = defaults('alt'),
        crossOrigin = defaults('crossOrigin'),
        fallback = defaults('fallback'),
        placeholder = defaults('placeholder'),
        preview = defaults('preview', true),
        imgStyle = defaults('imgStyle'),
        imgCls = defaults('imgCls'),
        setDownloadName = defaults('setDownloadName'),
        onLoad,
        onError,
        title,
        previewMenu,
        leftIcon,
        rightIcon,
        closeIcon,
        ...rest
    }: ImageProps = $props();

    const group = getPreviewContext();
    const locale = useLocale('Image');

    const prefixCls = cssClasses.PREFIX;
    const statusCls = `${prefixCls}-status`;
    const previewObject = $derived(typeof preview === 'object' && preview !== null ? preview : null);

    // The group lists its srcs as data; an image opens the entry of its own (or its preview's first) src. One that is
    // not listed, or that sits outside a group, previews on its own.
    const previewSrc = $derived(previewObject?.src ?? src);
    const groupIndex = $derived(group && preview ? group.srcList.indexOf([previewSrc].flat()[0] as string) : -1);
    const inGroup = $derived(groupIndex >= 0);

    const { foundation, states } = useFoundation<Foundation, Adapter, ImageProps, ImageState>(
        ImageFoundation,
        {
            get src() {
                return src;
            },
            get preview() {
                return preview;
            },
        },
        (view) => ImageFoundation.getInitialState(view),
        () => ({
            getIsInGroup: () => inGroup,
            openGroupPreview: () => group?.open(groupIndex),
            notifyLoad: (event) => onLoad?.(event),
            notifyError: (event) => onError?.(event),
            notifyPreviewVisibleChange: (visible) => previewObject?.onVisibleChange?.(visible),
        })
    );

    const loadStatus = $derived(states().loadStatus);
    const previewVisible = $derived(ImageFoundation.getPreviewVisible(preview, states()));
    const canOpen = $derived(ImageFoundation.canOpen(preview, loadStatus, inGroup));
    const canPreview = $derived(ImageFoundation.canPreview(preview, inGroup));
    const sizeStyle = $derived([width === undefined ? undefined : `width: ${toCssLength(width)}`, height === undefined ? undefined : `height: ${toCssLength(height)}`].filter(Boolean).join('; '));
    const attrs = $derived(splitControlAttrs(rest, (key) => key !== 'class' && key !== 'style'));
    const innerProps = $derived(previewObject ? omit(previewObject, ['visible', 'src', 'crossOrigin', 'setDownloadName', 'onVisibleChange']) : {});

    // A group image loads when it nears the viewport. Reading `src` re-observes after a src change, which the observer
    // needs to give a loaded image its new src.
    const lazy: Attachment<HTMLImageElement> = (node) => {
        void src;
        if (!group?.lazyLoad) {
            return;
        }
        const observer = new IntersectionObserver(loadLazyImages, { root: null, rootMargin: group.lazyLoadMargin });
        observer.observe(node);
        return () => observer.disconnect();
    };

    const handleClick = (event: MouseEvent) => {
        if (canOpen) {
            foundation.handleClick(event);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (canOpen) {
            foundation.handleKeyDown(event);
        }
    };
</script>

<!-- Space and Enter on the focused thumbnail click its img, which is how the keyboard reaches onclick of the img too -->
<div
    aria-haspopup={canOpen ? 'dialog' : undefined}
    aria-label={canOpen && !alt ? locale().locale.preview : undefined}
    class={[prefixCls, rest.class]}
    role={canOpen ? 'button' : undefined}
    style={[sizeStyle, rest.style].filter(Boolean).join('; ') || undefined}
    tabindex={canOpen ? 0 : undefined}
    onclick={handleClick}
    onkeydown={handleKeyDown}
>
    <img
        {...attrs.control}
        {@attach lazy}
        {alt}
        class={[`${prefixCls}-img`, { [`${prefixCls}-img-preview`]: canOpen, [`${prefixCls}-img-error`]: loadStatus === 'error' }, imgCls]}
        crossorigin={crossOrigin}
        data-src={src}
        {height}
        src={group?.lazyLoad ? undefined : src}
        style={imgStyle}
        {width}
        onerror={foundation.handleError}
        onload={foundation.handleLoaded}
    />
    {#if loadStatus !== 'success'}
        <div class="{prefixCls}-overlay">
            {#if loadStatus === 'error'}
                <div class={statusCls}>
                    {#if typeof fallback === 'function'}
                        {@render fallback()}
                    {:else if fallback}
                        <img alt={locale().locale.fallback} src={fallback} style="width: 100%; height: 100%" />
                    {:else}
                        <IconUploadError size="extra-large" />
                    {/if}
                </div>
            {:else if placeholder}
                <div class={statusCls}>{@render placeholder()}</div>
            {:else}
                <SkeletonImage style={sizeStyle} />
            {/if}
        </div>
    {/if}
    <!-- inside the root to keep one root; its content is moved out -->
    {#if canPreview}
        <PreviewInner
            {...innerProps}
            {alt}
            {closeIcon}
            crossOrigin={crossOrigin ?? previewObject?.crossOrigin}
            {leftIcon}
            onVisibleChange={foundation.handlePreviewVisibleChange}
            {previewMenu}
            {rightIcon}
            setDownloadName={setDownloadName ?? previewObject?.setDownloadName}
            src={previewSrc}
            {title}
            visible={previewVisible}
        />
    {/if}
</div>
