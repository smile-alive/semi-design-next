<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/tag/constants';
    import { getTagListKeys } from '@fibrae/semi-foundation/tag/tag-key';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import Popover from '../popover';
    import type { TagGroupEmits, TagGroupItem, TagGroupProps, TagGroupSlots, TagProps } from './interface';
    import Tag from './tag.vue';

    const props = withDefaults(defineProps<TagGroupProps & /* @vue-ignore */ ElementProps<'div', keyof TagGroupProps | EmitHandlers<TagGroupEmits>>>(), {
        maxTagCount: semiGlobalDefault('TagGroup', 'maxTagCount'),
        restCount: semiGlobalDefault('TagGroup', 'restCount'),
        size: () => semiDefault('TagGroup', 'size', 'default'),
        avatarShape: () => semiDefault('TagGroup', 'avatarShape', 'square'),
        showPopover: semiGlobalDefault('TagGroup', 'showPopover'),
        popoverProps: semiGlobalDefault('TagGroup', 'popoverProps'),
    });

    const emit = defineEmits<TagGroupEmits>();
    defineSlots<TagGroupSlots>();

    const prefix = cssClasses.PREFIX;
    const count = computed(() => (props.maxTagCount === undefined ? 0 : props.restCount || props.tagList.length - props.maxTagCount));
    const shown = computed(() => (count.value > 0 ? props.tagList.slice(0, props.maxTagCount) : props.tagList));
    const hidden = computed(() => (count.value > 0 ? props.tagList.slice(props.maxTagCount) : []));
    const shownKeys = computed(() => getTagListKeys(shown.value));
    const hiddenKeys = computed(() => getTagListKeys(hidden.value));

    const tagProps = ({ children: _children, ...tag }: TagGroupItem): TagProps => tag;
</script>

<template>
    <div :class="[`${prefix}-group`, { [`${prefix}-group-max`]: props.maxTagCount, [`${prefix}-group-small`]: props.size === 'small', [`${prefix}-group-large`]: props.size === 'large' }]">
        <template v-for="(tag, index) in shown" :key="shownKeys[index]">
            <slot v-if="$slots.tag" :index="index" name="tag" :tag="tag" />
            <Tag v-else v-bind="tagProps(tag)" :avatarShape="tag.avatarShape || props.avatarShape" :size="tag.size || props.size" :tagKey="tag.tagKey ?? tag.children ?? index" @close="(event, key) => emit('tagClose', event, key)">{{ tag.children }}</Tag>
        </template>
        <Popover v-if="count > 0 && props.showPopover" autoAdjustOverflow :class="`${prefix}-rest-group-popover`" position="top" showArrow trigger="hover" v-bind="props.popoverProps">
            <Tag color="grey" :size="props.size" :style="{ backgroundColor: 'transparent' }" @mouseenter="emit('plusNMouseEnter')">+{{ count }}</Tag>
            <template #content>
                <template v-for="(tag, index) in hidden" :key="hiddenKeys[index]">
                    <slot v-if="$slots.tag" :index="(props.maxTagCount ?? 0) + index" name="tag" :tag="tag" />
                    <Tag v-else v-bind="tagProps(tag)" :avatarShape="tag.avatarShape || props.avatarShape" :size="tag.size || props.size" :tagKey="tag.tagKey ?? tag.children ?? (props.maxTagCount ?? 0) + index" @close="(event, key) => emit('tagClose', event, key)">{{ tag.children }}</Tag>
                </template>
            </template>
        </Popover>
        <Tag v-else-if="count > 0" color="grey" :size="props.size" :style="{ backgroundColor: 'transparent' }" @mouseenter="emit('plusNMouseEnter')">+{{ count }}</Tag>
    </div>
</template>
