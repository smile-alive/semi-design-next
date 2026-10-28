<script setup lang="ts">
    import { type ComponentPublicInstance, type VNode, computed, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/typography/constants';
    import elementType from '../_base/element-type';
    import slotNodes from '../_base/slot-nodes';
    import Copyable from './copyable.vue';
    import Decorate from './decorate.vue';
    import type { TypographyCopySlots, TypographyNumeralEmits } from './interface';
    import type { ContentProps } from './internal';
    import NumeralNodes from './numeral-nodes.vue';

    const props = defineProps<ContentProps>();
    const emit = defineEmits<TypographyNumeralEmits & { toggle: [e: MouseEvent]; hover: []; copiedChange: [] }>();
    const slots = defineSlots<TypographyCopySlots & { icon?: () => VNode[] }>();

    // `component` may be a stateful Vue component, in which case the template ref is its instance, not an element
    const rootRef = useTemplateRef<HTMLElement | ComponentPublicInstance>('root');
    const expandButton = useTemplateRef('expandButton');
    const copyable = useTemplateRef('copyable');

    const prefix = cssClasses.PREFIX;

    const root = computed(() => {
        const target = rootRef.value;
        return target instanceof Element ? target : ((target?.$el as HTMLElement | undefined) ?? null);
    });

    const linkTags = computed(() => (props.linkClass === undefined ? [] : [{ tag: 'span', attrs: { class: props.linkClass } }]));

    defineExpose({
        root,
        expandButton,
        copyElement: (): Element | null => copyable.value?.$el ?? null,
    });
</script>

<template>
    <component :is="props.tag" ref="root" :class="prefix">
        <Decorate :tags="props.decorations">
            <template v-for="(icons, index) in [slotNodes($slots.icon?.() ?? [])]" :key="index">
                <span v-if="icons.length" :class="`${prefix}-icon`" x-semi-prop="icon">
                    <component :is="node" v-for="[node, key] in icons" :key="key" v-bind="elementType(node) === 'Icon' ? { size: props.iconSize } : {}" />
                </span>
            </template>
            <Decorate :tags="linkTags">
                <span v-if="props.hasEllipsis" @mouseenter="emit('hover')">
                    <NumeralNodes v-if="props.showFull" :format="props.format" :nodes="props.nodes" />
                    <template v-else>{{ props.ellipsisText }}</template
                    >{{ props.suffix }}
                </span>
                <NumeralNodes v-else :format="props.format" :nodes="props.nodes" />
            </Decorate>
        </Decorate>
        <button v-if="props.actionText !== undefined" ref="expandButton" :aria-expanded="props.actionToggles ? props.expanded : undefined" :class="`${prefix}-ellipsis-expand`" type="button" @click="emit('toggle', $event)">
            {{ props.actionText }}
        </button>
        <Copyable v-if="props.copy" ref="copyable" v-bind="props.copy" @copiedChange="emit('copiedChange')" @copy="(...args) => emit('copy', ...args)">
            <template v-for="(_, name) in $slots" #[name]="scope">
                <slot :name="name as keyof typeof slots" v-bind="scope" />
            </template>
        </Copyable>
    </component>
</template>
