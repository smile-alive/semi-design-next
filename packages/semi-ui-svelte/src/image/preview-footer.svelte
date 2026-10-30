<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import PreviewFooterFoundation, { type PreviewFooterAdapter, type PreviewFooterBaseProps, type PreviewFooterBaseState } from '@fibrae/semi-foundation/image/preview-footer-foundation';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import { Divider } from '../divider/index.js';
    import useLocale from '../locale/use-locale.svelte.js';
    import { FOOTER_ITEMS, type FooterView } from './footer.js';
    import type { MenuProps, RatioType, RotateDirection } from './interface.js';
    import PreviewFooterItem from './preview-footer-item.svelte';

    interface Props {
        min: number;
        max: number;
        step: number;
        curPage: number;
        totalNum: number;
        zoom: number;
        ratio: RatioType;
        disabledPrev: boolean;
        disabledNext: boolean;
        disableDownload: boolean;
        showTooltip: boolean;
        hidden: boolean;
        prevTip?: string;
        nextTip?: string;
        zoomInTip?: string;
        zoomOutTip?: string;
        rotateTip?: string;
        downloadTip?: string;
        adaptiveTip?: string;
        originTip?: string;
        previewMenu?: Snippet<[MenuProps]>;
        onZoomIn: (zoom: number) => void;
        onZoomOut: (zoom: number) => void;
        onAdjustRatio: (type: RatioType) => void;
        onRotate: (direction: RotateDirection) => void;
        onPrev: () => void;
        onNext: () => void;
        onDownload: () => void;
    }

    type Foundation = PreviewFooterFoundation<PreviewFooterBaseProps>;
    type Adapter = PreviewFooterAdapter<PreviewFooterBaseProps>;

    let { min, max, step, curPage, totalNum, zoom, ratio, disabledPrev, disabledNext, disableDownload, showTooltip, hidden, prevTip, nextTip, zoomInTip, zoomOutTip, rotateTip, downloadTip, adaptiveTip, originTip, previewMenu, onZoomIn, onZoomOut, onAdjustRatio, onRotate, onPrev, onNext, onDownload }: Props = $props();

    const locale = useLocale('Image');

    let root = $state.raw<HTMLElement | null>(null);

    const { foundation } = useFoundation<Foundation, Adapter, PreviewFooterBaseProps, PreviewFooterBaseState>(
        PreviewFooterFoundation,
        {
            get zoom() {
                return zoom;
            },
            get step() {
                return step;
            },
            get min() {
                return min;
            },
            get max() {
                return max;
            },
            get ratio() {
                return ratio;
            },
        },
        () => ({}),
        () => ({
            notifyZoomIn: (value) => onZoomIn(value),
            notifyZoomOut: (value) => onZoomOut(value),
            notifyAdjustRatio: (type) => onAdjustRatio(type),
            notifyRotate: (direction) => onRotate(direction),
        })
    );

    const cls = `${cssClasses.PREFIX}-preview-footer`;

    const handleZoomIn = () => foundation.changeSliderValue('plus');

    const handleZoomOut = () => foundation.changeSliderValue('minus');

    const handleRotateLeft = () => foundation.handleRotate('left');

    const view = $derived.by<FooterView>(() => {
        const text = locale().locale;
        return {
            showTooltip,
            curPage,
            totalNum,
            zoom,
            min,
            max,
            step,
            ratio,
            zoomLabel: text.zoom,
            buttons: {
                prev: { label: prevTip ?? text.prevTip, disabled: disabledPrev, onClick: onPrev },
                next: { label: nextTip ?? text.nextTip, disabled: disabledNext, onClick: onNext },
                zoomOut: { label: zoomOutTip ?? text.zoomOutTip, disabled: zoom === min, onClick: handleZoomOut },
                zoomIn: { label: zoomInTip ?? text.zoomInTip, disabled: zoom === max, onClick: handleZoomIn },
                ratio: { label: ratio === 'adaptation' ? (originTip ?? text.originTip) : (adaptiveTip ?? text.adaptiveTip), disabled: false, onClick: foundation.handleRatioClick },
                rotate: { label: rotateTip ?? text.rotateTip, disabled: false, onClick: handleRotateLeft },
                download: { label: downloadTip ?? text.downloadTip, disabled: disableDownload, onClick: onDownload },
            },
            onSlide: foundation.handleSlideChange,
        };
    });

    const handleRotateRight = () => foundation.handleRotate('right');

    const menuProps = $derived<MenuProps>({
        min,
        max,
        step,
        curPage,
        totalNum,
        zoom,
        ratio,
        disabledPrev,
        disabledNext,
        disabledZoomIn: zoom === max,
        disabledZoomOut: zoom === min,
        disableDownload,
        menuItems,
        onDownload,
        onNext,
        onPrev,
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onRatioClick: foundation.handleRatioClick,
        onRotateLeft: handleRotateLeft,
        onRotateRight: handleRotateRight,
    });

    export function getRoot() {
        return root;
    }
</script>

{#snippet menuItems()}
    {#each FOOTER_ITEMS as item (item)}
        <PreviewFooterItem {item} {view} />
    {/each}
{/snippet}

<section bind:this={root} class={[cls, `${cls}-wrapper`, { [`${cls}-content`]: !previewMenu, [`${cssClasses.PREFIX}-preview-hide`]: hidden }]}>
    {#if previewMenu}
        {@render previewMenu(menuProps)}
    {:else}
        {#each FOOTER_ITEMS as item, index (item)}
            <PreviewFooterItem {item} {view} />
            {#if index === 2 || index === 6}
                <Divider layout="vertical" />
            {/if}
        {/each}
    {/if}
</section>
