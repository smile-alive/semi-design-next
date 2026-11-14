<script lang="ts">
    import { on } from 'svelte/events';
    import { omit } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/cropper/constants';
    import CropperFoundation, { type CropperAdapter, type CropperFoundationProps, type CropperState } from '@fibrae/semi-foundation/components/cropper/foundation';
    import { getCropperGeometry } from '@fibrae/semi-foundation/components/cropper/utils';
    import '@fibrae/semi-foundation/components/cropper/cropper.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { observeResize } from '../resize-observer/index.js';
    import type { CropperProps } from './interface.js';

    type Adapter = CropperAdapter<CropperFoundationProps>;

    const defaults = useDefaultProps('Cropper');

    // No fallback on `zoom`: a bound `undefined` (form reset) would throw with one
    let {
        zoom = $bindable(),
        aspectRatio = defaults('aspectRatio'),
        classNames = defaults('classNames'),
        defaultAspectRatio = defaults('defaultAspectRatio', 1),
        fill = defaults('fill', 'rgba(0, 0, 0, 0)'),
        imgProps = defaults('imgProps'),
        maxZoom = defaults('maxZoom', 3),
        minZoom = defaults('minZoom', 0.1),
        preview = defaults('preview'),
        rotate = defaults('rotate'),
        shape = defaults('shape', 'rect'),
        showResizeBox = defaults('showResizeBox', true),
        src = defaults('src'),
        styles = defaults('styles'),
        zoomStep = defaults('zoomStep', 0.1),
        onZoomChange,
        ...rest
    }: CropperProps = $props();

    const locale = useLocale('Cropper');

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let img = $state<HTMLImageElement>();

    // $bindable needs destructuring, so the foundation reads the props through getters
    const foundationProps: CropperFoundationProps = {
        get aspectRatio() {
            return aspectRatio;
        },
        get defaultAspectRatio() {
            return defaultAspectRatio;
        },
        get fill() {
            return fill;
        },
        get maxZoom() {
            return maxZoom;
        },
        get minZoom() {
            return minZoom;
        },
        get preview() {
            return preview as CropperFoundationProps['preview'];
        },
        get rotate() {
            return rotate;
        },
        get showResizeBox() {
            return showResizeBox;
        },
        get src() {
            return src;
        },
        get zoom() {
            return zoom;
        },
        get zoomStep() {
            return zoomStep;
        },
    };

    const { foundation, states } = useFoundation<CropperFoundation, Adapter, CropperFoundationProps, CropperState>(
        CropperFoundation,
        foundationProps,
        () => CropperFoundation.getInitialState(),
        () => ({
            getContainer: () => root!,
            getImg: () => img!,
            notifyZoomChange: (next) => {
                // the bindable prop is the source of truth: bound, the write reaches the parent; unbound, it overrides locally
                zoom = next;
                onZoomChange?.(next);
            },
        })
    );

    const prefix = cssClasses.PREFIX;
    const geometry = $derived(getCropperGeometry(states().imgData, states().cropperBox));
    const corners = $derived(shape === 'round' ? strings.roundCorner : strings.corner);
    const role = $derived(rest.role ?? (rest['aria-label'] || rest['aria-labelledby'] ? 'group' : undefined));
    const imgStyle = $derived(`width: ${states().imgData.width}px; height: ${states().imgData.height}px; transform-origin: center; transform: translate(${geometry.imgX}px, ${geometry.imgY}px) rotate(${states().rotate}deg)`);
    const viewImgStyle = $derived(`width: ${states().imgData.width}px; height: ${states().imgData.height}px; transform-origin: center; transform: translate(${geometry.viewX}px, ${geometry.viewY}px) rotate(${states().rotate}deg)`);
    const boxStyle = $derived(`width: ${states().cropperBox.width}px; height: ${states().cropperBox.height}px; transform: translate(${geometry.boxX}px, ${geometry.boxY}px)`);

    // The user's attributes come first: the cropper owns src, class, style and the load order.
    const imgAttrs = $derived({ crossorigin: 'anonymous' as const, ...omit(imgProps ?? {}, ['class', 'style', 'src', 'onload']) });

    const handleLoad = (event: Event) => {
        foundation.handleImageLoad(event);
        // the spread of imgAttrs widens onload's currentTarget to Element
        imgProps?.onload?.(event as Event & { currentTarget: EventTarget & HTMLImageElement });
    };

    // preventDefault in handleWheel must stop a pinch from zooming the page, which only works from a non-passive listener
    const wheel = (node: HTMLElement) => on(node, 'wheel', foundation.handleWheel, { passive: false });

    /** Draws the area inside the cropper box, at the image's own resolution, onto a new canvas */
    export function getCropperCanvas() {
        return foundation.getCropperCanvas();
    }
</script>

<div {...rest} {@attach wheel} {@attach observeResize(foundation.handleResize)} bind:this={root} class={[prefix, rest.class]} {role}>
    <div class={cssClasses.IMG_WRAPPER}>
        <!-- the cropping surface, not content: there is no description to give -->
        <img {...imgAttrs} alt={imgProps?.alt ?? ''} bind:this={img} class={[cssClasses.IMG, imgProps?.class]} {src} style={[imgProps?.style, imgStyle].filter(Boolean).join('; ')} onload={handleLoad} />
    </div>
    <div class={cssClasses.MASK} onlostpointercapture={foundation.handleMaskLostPointerCapture} onpointerdown={foundation.handleMaskPointerDown} onpointermove={foundation.handleMaskPointerMove}></div>
    <!-- not a widget role: the box has no single value, so it is a named group that says how to use it -->
    <div
        aria-describedby="{uid}-help"
        aria-label={locale().locale.cropArea}
        aria-roledescription={locale().locale.cropAreaRole}
        class={[cssClasses.CROPPER_BOX, { [cssClasses.CROPPER_VIEW_BOX_ROUND]: shape === 'round' }, classNames?.cropperBox]}
        role="group"
        style={[styles?.cropperBox, boxStyle].filter(Boolean).join('; ')}
        tabindex={states().loaded ? 0 : undefined}
        onkeydown={foundation.handleCropperBoxKeyDown}
        onlostpointercapture={foundation.handleCropperBoxLostPointerCapture}
        onpointerdown={foundation.handleCropperBoxPointerDown}
        onpointermove={foundation.handleCropperBoxPointerMove}
    >
        <span hidden id="{uid}-help">{locale().locale.cropAreaHelp}</span>
        <div class={[cssClasses.CROPPER_VIEW_BOX, { [cssClasses.CROPPER_VIEW_BOX_ROUND]: shape.includes('round') }]}>
            <!-- a native image drag would cancel the pointer that moves the box -->
            <img alt="" class={cssClasses.CROPPER_IMG} draggable="false" {src} style={viewImgStyle} />
        </div>
        {#if states().loaded && showResizeBox}
            {#each corners as corner (corner)}
                <div class={[cssClasses.CORNER, `${cssClasses.CORNER}-${corner}`]} data-dir={corner} onlostpointercapture={foundation.handleCornerLostPointerCapture} onpointerdown={foundation.handleCornerPointerDown} onpointermove={foundation.handleCornerPointerMove}></div>
            {/each}
        {/if}
    </div>
</div>
