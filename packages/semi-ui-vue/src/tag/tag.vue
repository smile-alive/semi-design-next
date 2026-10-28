<script setup lang="ts">
    import { Text, useAttrs } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/tag/constants';
    import { moveFocusToAdjacentTag } from '@fibrae/semi-foundation/tag/focus';
    import '@fibrae/semi-foundation/tag/tag.scss';
    import { IconClose } from '@fibrae/semi-icons-vue';
    import { hasClickListener } from '../_base/control-attrs';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import useControllable from '../_base/use-controllable';
    import Avatar from '../avatar';
    import useLocale from '../locale/use-locale';
    import type { TagCloseEvent, TagEmits, TagProps, TagSlots } from './interface';

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<TagProps & /* @vue-ignore */ ElementProps<'div', keyof TagProps | EmitHandlers<TagEmits>>>(), {
        tabindex: semiGlobalDefault('Tag', 'tabindex'),
        tagKey: semiGlobalDefault('Tag', 'tagKey'),
        size: () => semiDefault('Tag', 'size', 'default'),
        color: () => semiDefault('Tag', 'color', 'grey'),
        type: () => semiDefault('Tag', 'type', 'light'),
        closable: () => semiDefault('Tag', 'closable', false),
        visible: semiGlobalDefault('Tag', 'visible'),
        avatarSrc: semiGlobalDefault('Tag', 'avatarSrc'),
        colorful: () => semiDefault('Tag', 'colorful', false),
        gradient: () => semiDefault('Tag', 'gradient', false),
        avatarShape: () => semiDefault('Tag', 'avatarShape', 'square'),
        shape: () => semiDefault('Tag', 'shape', 'square'),
    });

    const emit = defineEmits<TagEmits>();
    const slots = defineSlots<TagSlots>();
    const attrs = useAttrs();

    const locale = useLocale('Tag');

    const [isVisible, setVisible] = useControllable(
        () => props.visible,
        () => true,
        (value) => emit('update:visible', value)
    );

    const prefix = cssClasses.PREFIX;

    const interactive = () => hasClickListener(attrs) || props.closable;

    const stringContent = (): string | undefined => {
        const children = slots.default?.();
        return children?.length === 1 && children[0].type === Text && typeof children[0].children === 'string' ? children[0].children : undefined;
    };

    const ariaLabel = () => {
        if (typeof attrs['aria-label'] === 'string') return attrs['aria-label'];
        const text = interactive() ? stringContent() : undefined;
        // a function replacer keeps `$&` and `$$` in the text literal
        return text === undefined ? undefined : (props.closable ? locale.value.locale.closableTag : locale.value.locale.tag).replace('${tag}', () => text);
    };

    const close = (event: TagCloseEvent) => {
        event.stopPropagation();
        event.stopImmediatePropagation();
        emit('close', event, props.tagKey);
        if (event.defaultPrevented) return;
        moveFocusToAdjacentTag(event.currentTarget as Element);
        setVisible(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (interactive() && (event.key === 'Backspace' || event.key === 'Delete')) {
            if (props.closable) close(event);
            event.preventDefault();
            event.stopPropagation();
        } else if (interactive() && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            (event.currentTarget as HTMLElement).click();
        }
        emit('keydown', event);
    };
</script>

<template>
    <div
        v-bind="$attrs"
        :aria-label="ariaLabel()"
        :class="[
            prefix,
            `${prefix}-${props.size}`,
            `${prefix}-${props.shape}`,
            `${prefix}-${props.type}`,
            `${prefix}-${props.color}-${props.type}`,
            { [`${prefix}-closable`]: props.closable, [`${prefix}-invisible`]: isVisible === false, [`${prefix}-avatar-${props.avatarShape}`]: props.avatarSrc, [`${prefix}-colorful`]: props.colorful, [`${prefix}-gradient`]: props.gradient },
        ]"
        :role="interactive() ? 'button' : ($attrs.role as string | undefined)"
        :tabindex="interactive() ? (props.tabindex ?? 0) : props.tabindex"
        @keydown="handleKeyDown"
    >
        <div v-if="$slots.prefixIcon" :class="`${prefix}-prefix-icon`" x-semi-prop="prefixIcon">
            <slot name="prefixIcon" />
        </div>
        <Avatar v-if="props.avatarSrc" alt="" :shape="props.avatarShape" :src="props.avatarSrc" />
        <div :class="[`${prefix}-content`, `${prefix}-content-${stringContent() !== undefined ? 'ellipsis' : 'center'}`]">
            <slot />
        </div>
        <div v-if="$slots.suffixIcon" :class="`${prefix}-suffix-icon`" x-semi-prop="suffixIcon">
            <slot name="suffixIcon" />
        </div>
        <div v-if="props.closable" aria-hidden="true" :class="`${prefix}-close`" @click="close">
            <IconClose size="small" />
        </div>
    </div>
</template>
