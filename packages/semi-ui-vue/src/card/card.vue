<script setup lang="ts">
    import { Text } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/card/constants';
    import '@fibrae/semi-foundation/card/card.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { hasSlotContent } from '../_base/slot-nodes';
    import Skeleton, { SkeletonParagraph, SkeletonTitle } from '../skeleton';
    import Space from '../space';
    import { TypographyTitle } from '../typography';
    import type { CardProps, CardSlots } from './interface';

    const props = withDefaults(defineProps<CardProps & /* @vue-ignore */ ElementProps<'div', keyof CardProps>>(), {
        bodyStyle: semiGlobalDefault('Card', 'bodyStyle'),
        bordered: () => semiDefault('Card', 'bordered', true),
        footerLine: () => semiDefault('Card', 'footerLine', false),
        footerStyle: semiGlobalDefault('Card', 'footerStyle'),
        headerLine: () => semiDefault('Card', 'headerLine', true),
        headerStyle: semiGlobalDefault('Card', 'headerStyle'),
        loading: () => semiDefault('Card', 'loading', false),
        shadows: semiGlobalDefault('Card', 'shadows'),
    });

    const slots = defineSlots<CardSlots>();

    const prefixCls = cssClasses.PREFIX;

    // Slots are not reactive, so the header is decided during render; the header slot wins over title and
    // headerExtraContent. `titleText` is the title prop or a single non-empty text node of the title slot; it renders as
    // a div, since a heading there would break the page outline.
    const headerView = () => {
        const nodes = slots.title ? slotNodes(slots.title()) : [];
        const only = nodes.length === 1 ? nodes[0][0] : undefined;
        const hasTitleSlot = nodes.some(([node]) => node.type !== Text || node.children !== '');
        const titleText = hasTitleSlot && only?.type === Text && typeof only.children === 'string' && only.children !== '' ? only.children : hasTitleSlot ? undefined : props.title || undefined;
        const hasExtra = hasSlotContent(slots.headerExtraContent);
        const hasTitle = hasTitleSlot || titleText !== undefined;
        const hasHeader = hasSlotContent(slots.header);
        return { titleNodes: nodes, titleText, hasExtra, hasTitle, hasHeader, show: hasHeader || hasExtra || hasTitle };
    };
</script>

<template>
    <div
        :aria-busy="props.loading ? 'true' : 'false'"
        :class="[
            prefixCls,
            {
                [`${prefixCls}-bordered`]: props.bordered,
                [`${prefixCls}-shadows`]: props.shadows,
                [`${prefixCls}-shadows-${props.shadows}`]: props.shadows,
            },
        ]"
        :role="groupRole($attrs)"
    >
        <template v-for="header in [headerView()]" :key="String(header.show)">
            <div v-if="header.show" :class="[`${prefixCls}-header`, { [`${prefixCls}-header-bordered`]: props.headerLine }]" :style="props.headerStyle">
                <slot v-if="header.hasHeader" name="header" />
                <div v-else :class="`${prefixCls}-header-wrapper`">
                    <div v-if="header.hasTitle" :class="[`${prefixCls}-header-wrapper-title`, { [`${prefixCls}-header-wrapper-spacing`]: header.hasExtra }]">
                        <TypographyTitle v-if="header.titleText !== undefined" component="div" :ellipsis="{ showTooltip: true, rows: 1 }" :heading="6" x-semi-prop="title">
                            {{ header.titleText }}
                        </TypographyTitle>
                        <template v-else>
                            <component :is="node" v-for="[node, key] in header.titleNodes" :key="key" />
                        </template>
                    </div>
                    <div v-if="header.hasExtra" :class="`${prefixCls}-header-wrapper-extra`" x-semi-prop="headerExtraContent">
                        <slot name="headerExtraContent" />
                    </div>
                </div>
            </div>
        </template>
        <div v-if="hasSlotContent($slots.cover)" :class="`${prefixCls}-cover`" x-semi-prop="cover">
            <slot name="cover" />
        </div>
        <div :class="`${prefixCls}-body`" :style="props.bodyStyle">
            <Skeleton v-if="hasSlotContent($slots.default)" active :loading="props.loading">
                <template #placeholder>
                    <div>
                        <SkeletonTitle />
                        <br />
                        <SkeletonParagraph :rows="3" />
                    </div>
                </template>
                <slot />
            </Skeleton>
            <div v-if="$slots.actions" :class="`${prefixCls}-body-actions`">
                <Space :spacing="12">
                    <div v-for="([node, key], index) in slotNodes($slots.actions())" :key="key" :class="`${prefixCls}-body-actions-item`" :x-semi-prop="`actions.${index}`">
                        <component :is="node" />
                    </div>
                </Space>
            </div>
        </div>
        <div v-if="hasSlotContent($slots.footer)" :class="[`${prefixCls}-footer`, { [`${prefixCls}-footer-bordered`]: props.footerLine }]" :style="props.footerStyle" x-semi-prop="footer">
            <slot name="footer" />
        </div>
    </div>
</template>
