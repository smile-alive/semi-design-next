<script setup lang="ts">
    import { computed, onMounted, shallowRef, useTemplateRef, watch, type StyleValue } from 'vue';
    import { isEqual, omit } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/image/constants';
    import ImageFoundation, { type ImageAdapter, type ImageLoadStatus } from '@fibrae/semi-foundation/image/image-foundation';
    import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
    import '@fibrae/semi-foundation/image/image.scss';
    import { IconUploadError } from '@fibrae/semi-icons-vue';
    import { isNotClassOrStyle, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useControllable from '../_base/use-controllable';
    import useFoundation from '../_base/use-foundation';
    import useLocale from '../locale/use-locale';
    import { SkeletonImage } from '../skeleton';
    import { usePreviewContext, type GroupImage } from './context';
    import type { ImageEmits, ImageProps, ImageSlots } from './interface';
    import PreviewInner from './preview-inner.vue';

    type Foundation = ImageFoundation<ImageProps, Record<string, never>>;
    type Adapter = ImageAdapter<ImageProps, Record<string, never>>;

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ImageProps & /* @vue-ignore */ ElementProps<'img', keyof ImageProps | EmitHandlers<ImageEmits>>>(), {
        src: semiGlobalDefault('Image', 'src'),
        width: semiGlobalDefault('Image', 'width'),
        height: semiGlobalDefault('Image', 'height'),
        alt: semiGlobalDefault('Image', 'alt'),
        crossOrigin: semiGlobalDefault('Image', 'crossOrigin'),
        fallback: semiGlobalDefault('Image', 'fallback'),
        preview: () => semiDefault('Image', 'preview', true),
        imgStyle: semiGlobalDefault('Image', 'imgStyle'),
        imgCls: semiGlobalDefault('Image', 'imgCls'),
        setDownloadName: undefined,
    });

    const emit = defineEmits<ImageEmits>();
    const slots = defineSlots<ImageSlots>();

    const group = usePreviewContext();
    const locale = useLocale('Image');
    const semi = useSemiGlobal();

    const root = useTemplateRef('root');
    const load = shallowRef<{ src: string | undefined; status: ImageLoadStatus }>({ src: props.src, status: 'loading' });

    const prefixCls = cssClasses.PREFIX;
    const statusCls = `${prefixCls}-status`;
    const loadStatus = computed(() => (load.value.src === props.src ? load.value.status : 'loading'));
    const previewObject = computed(() => (typeof props.preview === 'object' && props.preview !== null ? props.preview : null));

    const [previewVisible, setPreviewVisible] = useControllable<boolean>(
        () => (previewObject.value?.visible === undefined ? undefined : Boolean(previewObject.value.visible)),
        () => false,
        () => {},
        { keepLastControlled: true }
    );

    const { foundation } = useFoundation<Foundation, Adapter, ImageProps, Record<string, never>>(
        ImageFoundation,
        props,
        () => ({}),
        () => ({
            getIsInGroup: () => Boolean(group),
            openGroupPreview: () => {
                if (group && root.value) {
                    group.openImage(root.value);
                }
            },
            setLoadStatus: (status) => {
                load.value = { src: props.src, status };
            },
            setPreviewVisible,
            notifyLoad: (e) => emit('load', e),
            notifyError: (e) => emit('error', e),
            notifyPreviewVisibleChange: (visible) => previewObject.value?.onVisibleChange?.(visible),
        })
    );

    const setDownloadName = computed(() => props.setDownloadName ?? readSemiDefault(semi, 'Image', 'setDownloadName'));
    const canOpen = computed(() => ImageFoundation.canOpen(props.preview, loadStatus.value, Boolean(group)));
    const canPreview = computed(() => ImageFoundation.canPreview(props.preview, Boolean(group)));
    const previewSrc = computed(() => previewObject.value?.src ?? props.src);

    // Every group image registers, even without preview: the group lazy-loads them all.
    const registration = computed<Omit<GroupImage, 'node'>>((previous) => {
        const next = {
            src: props.src as string,
            previewSrc: props.preview ? previewSrc.value : undefined,
            title: previewObject.value?.previewTitle,
            alt: props.alt,
        };
        return previous && isEqual(previous, next) ? previous : next;
    });

    // fallback and placeholder render in the thumbnail; the rest belong to the preview
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'fallback' && name !== 'placeholder');

    const sizeStyle = () => ({ width: toCssLength(props.width), height: toCssLength(props.height) });

    // no src key for a lazy group img: Vue writes an empty src for undefined, which fails to load
    const imgAttrs = (attrs: Record<string, unknown>) => ({
        ...splitControlAttrs(attrs, isNotClassOrStyle).control,
        ...(group?.view.value.lazyLoad ? {} : { src: props.src }),
    });

    const innerProps = () => (previewObject.value ? omit(previewObject.value, ['visible', 'src', 'crossOrigin', 'setDownloadName', 'onVisibleChange']) : {});

    if (group) {
        onMounted(() =>
            watch(
                registration,
                (entry, _, onCleanup) => {
                    const node = root.value as HTMLDivElement;
                    group.registerImage({ ...entry, node });
                    onCleanup(() => group.unregisterImage(node));
                },
                { immediate: true }
            )
        );
    }

    const onClick = (e: MouseEvent) => {
        if (canOpen.value) {
            foundation.handleClick(e);
        }
    };

    const onKeydown = (e: KeyboardEvent) => {
        if (canOpen.value) {
            foundation.handleKeyDown(e);
        }
    };
</script>

<template>
    <div
        ref="root"
        :aria-haspopup="canOpen ? 'dialog' : undefined"
        :aria-label="canOpen && !props.alt ? locale.locale.preview : undefined"
        :class="[prefixCls, $attrs.class]"
        :role="canOpen ? 'button' : undefined"
        :style="[sizeStyle(), $attrs.style as StyleValue]"
        :tabindex="canOpen ? 0 : undefined"
        @click="onClick"
        @keydown="onKeydown"
    >
        <img
            v-bind="imgAttrs($attrs)"
            :alt="props.alt"
            :class="[
                `${prefixCls}-img`,
                {
                    [`${prefixCls}-img-preview`]: canOpen,
                    [`${prefixCls}-img-error`]: loadStatus === 'error',
                },
                props.imgCls,
            ]"
            :crossorigin="props.crossOrigin"
            :data-src="props.src"
            :height="props.height"
            :style="props.imgStyle"
            :width="props.width"
            @error="foundation.handleError"
            @load="foundation.handleLoaded"
        />
        <div v-if="loadStatus !== 'success'" :class="`${prefixCls}-overlay`">
            <div v-if="loadStatus === 'error'" :class="statusCls">
                <slot name="fallback">
                    <img v-if="props.fallback" :alt="locale.locale.fallback" :src="props.fallback" style="width: 100%; height: 100%" />
                    <IconUploadError v-else size="extra-large" />
                </slot>
            </div>
            <div v-else-if="$slots.placeholder" :class="statusCls">
                <slot name="placeholder" />
            </div>
            <SkeletonImage v-else :style="sizeStyle()" />
        </div>
        <!-- inside the root to keep one root; its content is teleported out -->
        <PreviewInner v-if="canPreview" v-bind="innerProps()" :alt="props.alt" :crossOrigin="props.crossOrigin ?? previewObject?.crossOrigin" :setDownloadName="setDownloadName" :src="previewSrc" :visible="Boolean(previewVisible)" @visibleChange="foundation.handlePreviewVisibleChange">
            <template v-for="name in passedSlots()" #[name]="scope">
                <slot :name="name as keyof ImageSlots" v-bind="scope" />
            </template>
        </PreviewInner>
    </div>
</template>
