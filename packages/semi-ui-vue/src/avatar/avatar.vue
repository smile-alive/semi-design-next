<script setup lang="ts">
    import { computed, mergeProps, onUpdated, useAttrs, useTemplateRef, watch, type StyleValue } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/avatar/constants';
    import AvatarFoundation, { type AvatarAdapter } from '@fibrae/semi-foundation/avatar/foundation';
    import '@fibrae/semi-foundation/avatar/avatar.scss';
    import { hasClickListener, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import { usePopupLayer } from '../_base/popup-layer';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import useFoundation from '../_base/use-foundation';
    import AvatarContent from './avatar-content.vue';
    import { provideAvatarGroupContext, provideAvatarGroupMoreContext, useAvatarGroupContext, useAvatarGroupMoreContext } from './context';
    import type { AvatarEmits, AvatarProps, AvatarSlots } from './interface';
    import getAvatarText from './text';
    import TopSlotSvg from './top-slot-svg.vue';

    interface AvatarState {
        isImgExist: boolean;
        hovered: boolean;
        scale: number;
    }

    type Foundation = AvatarFoundation<AvatarProps, AvatarState, MouseEvent>;
    type Adapter = AvatarAdapter<AvatarProps, AvatarState, MouseEvent>;

    defineOptions({ name: 'Avatar', inheritAttrs: false });

    const props = withDefaults(defineProps<AvatarProps & /* @vue-ignore */ ElementProps<'span', keyof AvatarProps | EmitHandlers<AvatarEmits>>>(), {
        // size and shape are resolved below from the enclosing AvatarGroup (in the same popup layer) and its `more` slot before the global defaults.
        size: undefined,
        shape: undefined,
        color: () => semiDefault('Avatar', 'color', 'grey'),
        gap: () => semiDefault('Avatar', 'gap', 3),
        src: semiGlobalDefault('Avatar', 'src'),
        srcSet: semiGlobalDefault('Avatar', 'srcSet'),
        alt: semiGlobalDefault('Avatar', 'alt'),
        imgAttr: semiGlobalDefault('Avatar', 'imgAttr'),
        topSlot: semiGlobalDefault('Avatar', 'topSlot'),
        bottomSlot: semiGlobalDefault('Avatar', 'bottomSlot'),
        border: semiGlobalDefault('Avatar', 'border'),
        contentMotion: semiGlobalDefault('Avatar', 'contentMotion'),
        onError: undefined,
    });

    const emit = defineEmits<AvatarEmits>();
    const slots = defineSlots<AvatarSlots>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const more = useAvatarGroupMoreContext();
    const group = useAvatarGroupContext();
    const layer = usePopupLayer();

    // explicit type: the ref feeds the foundation adapter whose state the template reads, an inference cycle (TS7022)
    const content = useTemplateRef<InstanceType<typeof AvatarContent>>('content');
    let previousText: string | undefined;

    const prefix = cssClasses.PREFIX;
    const groupItem = computed(() => (group && group.value.layer === layer ? group.value : undefined));

    // As in React, the group's values override a list item's own wherever it sits in the group, while an avatar in the
    // `more` slot keeps its own and only falls back to the group's
    const size = computed(() => (more ? (props.size ?? more.value.size) : (groupItem.value?.size ?? props.size)) ?? readSemiDefault(semi, 'Avatar', 'size', 'medium'));
    const shape = computed(() => (more ? (props.shape ?? more.value.shape) : (groupItem.value?.shape ?? props.shape)) ?? readSemiDefault(semi, 'Avatar', 'shape', 'circle'));
    const onError = computed(() => props.onError ?? readSemiDefault(semi, 'Avatar', 'onError'));

    const { foundation, state } = useFoundation<Foundation, Adapter, AvatarProps, AvatarState>(
        AvatarFoundation,
        props,
        () => ({ isImgExist: true, hovered: false, scale: 1 }),
        (base) => ({
            setImgExist: (isImgExist) => base.setState({ isImgExist }),
            setScale: (scale) => base.setState({ scale }),
            notifyError: () => onError.value?.(),
            notifyEnter: (event) => {
                base.setState({ hovered: true });
                emit('mouseEnter', event);
            },
            notifyLeave: (event) => {
                base.setState({ hovered: false });
                emit('mouseLeave', event);
            },
            getTextWidths: () => content.value?.getTextWidths() ?? null,
        })
    );

    const isImg = computed(() => Boolean(props.src) && state.value.isImgExist);

    const image = computed(() => {
        if (!isImg.value) return undefined;
        // imgAttr.alt replaces alt even when it is explicitly undefined; mergeProps runs both onError listeners.
        return mergeProps({ src: props.src, srcset: props.srcSet, alt: props.alt }, { ...props.imgAttr }, { onError: () => foundation.handleImgLoadError() });
    });

    const isPresetSize = computed(() => strings.SIZE.some((preset) => preset === size.value));
    const sizeStyle = computed(() => (isPresetSize.value ? {} : { width: size.value, height: size.value }));

    // Top and bottom slots have no style for extra-extra-small or custom sizes.
    const hasSlotSize = computed(() => isPresetSize.value && size.value !== 'extra-extra-small');

    const avatarClass = computed(() => [
        prefix,
        `${prefix}-${size.value}`,
        `${prefix}-${shape.value}`,
        more?.value.itemClass,
        {
            [`${prefix}-${props.color}`]: props.color && !isImg.value,
            [`${prefix}-img`]: isImg.value,
            [`${prefix}-animated`]: props.contentMotion,
        },
    ]);

    const borderClass = computed(() => [`${prefix}-additionalBorder`, `${prefix}-additionalBorder-${size.value}`, `${prefix}-${shape.value}`]);
    const borderStyle = computed(() => (typeof props.border === 'object' ? { borderColor: props.border.color } : {}));

    // Avatars nested in this one's slots are not items of the group.
    provideAvatarGroupMoreContext(undefined);
    provideAvatarGroupContext(undefined);

    const wrapped = () => Boolean(props.topSlot || props.bottomSlot || slots.topSlot || slots.bottomSlot || slots.topSlotText || slots.bottomSlotText || props.border);

    const clickable = () => hasClickListener(attrs);

    const isControlKey = (key: string) => clickable() && (key === 'tabindex' || key.startsWith('aria-'));

    const text = () => (isImg.value ? undefined : getAvatarText(slots.default?.() ?? []));

    // The avatar span sits at the root or inside the wrapper; style always sizes the outermost element.
    const contentBinding = () => {
        const { root, control } = splitControlAttrs(attrs, isControlKey);
        const { style: _style, ...rest } = root;
        return {
            ...rest,
            role: (rest.role as string | undefined) ?? (more && more.value.layer === layer ? 'listitem' : undefined),
            class: [avatarClass.value, rest.class],
            alt: props.alt,
            clickable: clickable(),
            controlAttrs: control,
            hovered: state.value.hovered,
            image: image.value,
            scale: state.value.scale,
            text: text(),
        };
    };

    watch(
        () => props.src,
        () => foundation.handleSrcChange()
    );

    watch(content, () => foundation.changeScale(), { flush: 'post' });

    onUpdated(() => {
        const value = content.value?.getText();
        if (value !== previousText) {
            previousText = value;
            if (value !== undefined) foundation.changeScale();
        }
    });
</script>

<template>
    <span v-if="wrapped()" :class="`${prefix}-wrapper`" :style="[sizeStyle, $attrs.style as StyleValue]" @mouseenter="foundation.handleEnter($event)" @mouseleave="foundation.handleLeave($event)">
        <div v-if="props.border" :style="[{ position: 'relative' }, sizeStyle]">
            <AvatarContent ref="content" v-bind="contentBinding()">
                <slot /> <template v-if="$slots.hoverMask" #hoverMask><slot name="hoverMask" /></template>
            </AvatarContent>
            <span :class="borderClass" :style="borderStyle" />
            <span v-if="typeof props.border === 'object' && props.border.motion" :class="[borderClass, `${prefix}-additionalBorder-animated`]" :style="borderStyle" />
        </div>
        <AvatarContent v-else ref="content" v-bind="contentBinding()">
            <slot /> <template v-if="$slots.hoverMask" #hoverMask><slot name="hoverMask" /></template>
        </AvatarContent>
        <template v-if="hasSlotSize && shape === 'circle' && (props.topSlot || $slots.topSlot || $slots.topSlotText)">
            <slot name="topSlot">
                <div :class="[`${prefix}-top_slot-wrapper`, props.topSlot?.className, { [`${prefix}-animated`]: props.contentMotion }]" :style="props.topSlot?.style">
                    <div :class="[`${prefix}-top_slot-bg`, `${prefix}-top_slot-bg-${size}`]">
                        <div :class="[`${prefix}-top_slot-bg-svg`, `${prefix}-top_slot-bg-svg-${size}`]">
                            <TopSlotSvg :gradientEnd="props.topSlot?.gradientEnd ?? 'var(--semi-color-primary)'" :gradientStart="props.topSlot?.gradientStart ?? 'var(--semi-color-primary)'" />
                        </div>
                    </div>
                    <div :class="`${prefix}-top_slot`">
                        <div :class="[`${prefix}-top_slot-content`, `${prefix}-top_slot-content-${size}`]" :style="{ color: props.topSlot?.textColor }">
                            <slot name="topSlotText" />
                        </div>
                    </div>
                </div>
            </slot>
        </template>
        <template v-if="hasSlotSize && (props.bottomSlot || $slots.bottomSlot || $slots.bottomSlotText)">
            <slot name="bottomSlot">
                <div :class="`${prefix}-bottom_slot`" :style="props.bottomSlot?.style">
                    <span :class="[`${prefix}-bottom_slot-shape_${props.bottomSlot?.shape}`, `${prefix}-bottom_slot-shape_${props.bottomSlot?.shape}-${size}`, props.bottomSlot?.className]" :style="{ backgroundColor: props.bottomSlot?.bgColor, color: props.bottomSlot?.textColor }">
                        <slot name="bottomSlotText" />
                    </span>
                </div>
            </slot>
        </template>
    </span>
    <AvatarContent v-else ref="content" v-bind="contentBinding()" :style="[sizeStyle, $attrs.style as StyleValue]" @mouseenter="foundation.handleEnter($event)" @mouseleave="foundation.handleLeave($event)">
        <slot /> <template v-if="$slots.hoverMask" #hoverMask><slot name="hoverMask" /></template>
    </AvatarContent>
</template>
