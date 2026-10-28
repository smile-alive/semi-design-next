<script setup lang="ts">
    import { Text, computed, useId, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/collapse/constants';
    import CollapseFoundation from '@fibrae/semi-foundation/collapse/foundation';
    import { IconChevronDown, IconChevronUp } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import SlotFragment from '../_base/slot-fragment';
    import slotNodes, { hasSlotContent } from '../_base/slot-nodes';
    import Collapsible from '../collapsible';
    import { useCollapseContext } from './context';
    import type { CollapsePanelEmits, CollapsePanelProps, CollapsePanelSlots } from './interface';

    const props = withDefaults(defineProps<CollapsePanelProps & /* @vue-ignore */ ElementProps<'div', keyof CollapsePanelProps | EmitHandlers<CollapsePanelEmits>>>(), { showArrow: true, disabled: false });
    const emit = defineEmits<CollapsePanelEmits>();
    const slots = defineSlots<CollapsePanelSlots>();

    const ctx = useCollapseContext('Collapse.Panel');

    // refs inside the v-for are arrays
    const buttons = useTemplateRef('button');
    const leftIcons = useTemplateRef('leftIcon');
    const rightIcons = useTemplateRef('rightIcon');

    // Not a computed because slots are not reactive. Idempotent for the same inputs, so a repeated render is harmless.
    let everOpened = false;

    const prefixCls = cssClasses.PREFIX;
    const ariaId = `${prefixCls}-${useId()}`;
    const headerId = `${ariaId}-header`;
    const active = computed(() => ctx.view.value.activeSet.has(props.itemKey));
    const iconLeft = computed(() => ctx.view.value.expandIconPosition === 'left');

    const hasContent = () => hasSlotContent(slots.default);

    // A text header keeps the empty extra span: its end padding spaces the arrow. Elements do not count.
    const textHeader = () => {
        const nodes = slotNodes(slots.header?.() ?? []);
        return nodes.length > 0 && nodes.every(([node]) => node.type === Text);
    };

    const hasRight = () => textHeader() || hasSlotContent(slots.extra);

    const iconEnabled = (has: boolean) => has && !props.disabled;

    const iconClass = (has: boolean) => [`${prefixCls}-header-icon`, { [`${prefixCls}-header-iconDisabled`]: !iconEnabled(has) }];

    const contentMounted = (hasBody: boolean) => {
        everOpened = CollapseFoundation.isEverOpened({ hasBody, active: active.value, everOpened });
        const { keepDOM, lazyRender } = ctx.view.value;
        return CollapseFoundation.isContentMounted({ hasBody, active: active.value, keepDOM, lazyRender, everOpened });
    };

    const handleHeaderClick = (event: MouseEvent) => {
        // The only toggle handler: the button's click (also fired by Enter, Space and assistive tech) bubbles here, so a
        // handler on the button as well would toggle twice. Without clickHeaderToExpand the rest of the row, including
        // extra, does not toggle.
        const target = event.target as Node;
        if (!props.disabled && (ctx.view.value.clickHeaderToExpand || buttons.value?.[0]?.contains(target) || leftIcons.value?.[0]?.contains(target) || rightIcons.value?.[0]?.contains(target))) {
            ctx.onClick(props.itemKey, event);
        }
    };
</script>

<template>
    <div :class="[`${prefixCls}-item`, { [`${prefixCls}-item-active`]: active }]">
        <template v-for="(has, hasIndex) in [hasContent()]" :key="hasIndex">
            <div v-for="(right, rightIndex) in [hasRight()]" :key="rightIndex" :class="[`${prefixCls}-header`, { [`${prefixCls}-header-disabled`]: props.disabled, [`${prefixCls}-header-iconLeft`]: iconLeft }]" @click="handleHeaderClick">
                <span v-if="props.showArrow && iconLeft" ref="leftIcon" aria-hidden="true" :class="iconClass(has)">
                    <template v-if="iconEnabled(has) && active">
                        <component :is="ctx.slots.collapseIcon" v-if="ctx.slots.collapseIcon" />
                        <IconChevronUp v-else />
                    </template>
                    <template v-else>
                        <component :is="ctx.slots.expandIcon" v-if="ctx.slots.expandIcon" />
                        <IconChevronDown v-else />
                    </template>
                </span>
                <!-- APG Accordion: the button sits in a heading. role="heading" rather than h3, since host pages often
                    style h3 without a layer and those rules would beat Semi's layered styles. Level 3 as in Radix
                    Accordion, which assumes the accordion sits under the page's h1 and a section h2. -->
                <div aria-level="3" :class="`${prefixCls}-header-title`" role="heading">
                    <button :id="headerId" ref="button" :aria-controls="contentMounted(has) ? ariaId : undefined" :aria-expanded="active" :class="`${prefixCls}-header-button`" :disabled="props.disabled" type="button">
                        <slot name="header" />
                    </button>
                </div>
                <!-- extra stays outside the button so it may hold its own controls -->
                <component :is="right ? 'span' : SlotFragment" :class="right ? `${prefixCls}-header-right` : undefined">
                    <span v-if="right">
                        <slot name="extra" />
                    </span>
                    <span v-if="props.showArrow && !iconLeft" ref="rightIcon" aria-hidden="true" :class="iconClass(has)">
                        <template v-if="iconEnabled(has) && active">
                            <component :is="ctx.slots.collapseIcon" v-if="ctx.slots.collapseIcon" />
                            <IconChevronUp v-else />
                        </template>
                        <template v-else>
                            <component :is="ctx.slots.expandIcon" v-if="ctx.slots.expandIcon" />
                            <IconChevronDown v-else />
                        </template>
                    </span>
                </component>
            </div>
            <Collapsible v-if="has" :isOpen="active" :keepDOM="ctx.view.value.keepDOM" :lazyRender="ctx.view.value.lazyRender" :motion="ctx.view.value.motion" @motionEnd="emit('motionEnd')">
                <div :id="ariaId" :aria-labelledby="headerId" :class="`${prefixCls}-content`" :inert="active ? undefined : 'true'" role="region">
                    <div :class="`${prefixCls}-content-wrapper`">
                        <slot />
                    </div>
                </div>
            </Collapsible>
        </template>
    </div>
</template>
