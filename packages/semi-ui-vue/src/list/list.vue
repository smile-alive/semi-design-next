<script setup lang="ts" generic="T = any">
    import { computed, Comment, Fragment, useAttrs, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/list/constants';
    import '@fibrae/semi-foundation/list/list.scss';
    import type { ElementProps } from '../_base/element-props';
    import { groupRole } from '../_base/group-role';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../_base/semi-default';
    import { type KeyedNode, hasSlotContent } from '../_base/slot-nodes';
    import { Row } from '../grid';
    import useLocale from '../locale/use-locale';
    import Spin from '../spin';
    import { provideListContext } from './context';
    import type { ListProps, ListSlots } from './interface';

    const props = withDefaults(defineProps<ListProps<T> & /* @vue-ignore */ ElementProps<'div', keyof ListProps<T>>>(), {
        bordered: () => semiDefault('List', 'bordered', false),
        dataSource: semiGlobalDefault('List', 'dataSource'),
        grid: semiGlobalDefault('List', 'grid'),
        layout: () => semiDefault('List', 'layout', 'vertical'),
        loading: () => semiDefault('List', 'loading', false),
        size: () => semiDefault('List', 'size', 'default'),
        split: () => semiDefault('List', 'split', true),
        onClick: undefined,
        onRightClick: undefined,
    });

    const slots = defineSlots<ListSlots<T>>();
    const attrs = useAttrs();

    const semi = useSemiGlobal();
    const locale = useLocale('List');

    const prefixCls = cssClasses.PREFIX;

    provideListContext(
        computed(() => ({
            grid: props.grid,
            onClick: props.onClick ?? readSemiDefault(semi, 'List', 'onClick'),
            onRightClick: props.onRightClick ?? readSemiDefault(semi, 'List', 'onRightClick'),
        }))
    );

    // A node keeps its own key so the DOM follows a reordered dataSource; slotNodes keys would repeat across entries.
    const renderedItems = (): KeyedNode[] => {
        const nodes: VNode[] = [];
        const collect = (list: VNode[]) => {
            for (const node of list) {
                if (node.type === Fragment) collect(node.children as VNode[]);
                else if (node.type !== Comment) nodes.push(node);
            }
        };
        props.dataSource?.forEach((item, index) => collect(slots.item?.({ item, index }) ?? []));
        // the compiler injects `key: 0/1` on a v-if/v-else slot root, so a repeated key falls back to the position, or
        // the keyed diff pairs two old nodes with one new node
        const used = new Set<string>();
        return nodes.map((node, position) => {
            const own = node.key == null ? undefined : String(node.key);
            const key = own !== undefined && !used.has(own) ? own : `list-item-${position}`;
            used.add(key);
            return [node, key];
        });
    };

    const showEmpty = () => !props.dataSource?.length && !hasSlotContent(slots.default);
</script>

<template>
    <div
        :class="[
            prefixCls,
            { [`${prefixCls}-flex`]: props.layout === 'horizontal' },
            `${prefixCls}-${props.size}`,
            {
                [`${prefixCls}-grid`]: props.grid,
                [`${prefixCls}-split`]: props.split,
                [`${prefixCls}-bordered`]: props.bordered,
            },
        ]"
        :role="groupRole(attrs)"
    >
        <div v-if="hasSlotContent($slots.header)" :class="`${prefixCls}-header`" x-semi-prop="header">
            <slot name="header" />
        </div>
        <Spin size="large" :spinning="props.loading">
            <template v-if="showEmpty()">
                <div v-if="hasSlotContent($slots.emptyContent)" :class="`${prefixCls}-empty`" x-semi-prop="emptyContent">
                    <slot name="emptyContent" />
                </div>
                <div v-else :class="`${prefixCls}-empty`">{{ locale.locale.emptyText }}</div>
            </template>
            <Row v-else-if="props.grid" :align="props.grid.align" :gutter="props.grid.gutter" :justify="props.grid.justify" role="list" type="flex">
                <component :is="node" v-for="[node, key] in renderedItems()" :key="key" />
                <slot />
            </Row>
            <ul v-else :class="`${prefixCls}-items`">
                <component :is="node" v-for="[node, key] in renderedItems()" :key="key" />
                <slot />
            </ul>
        </Spin>
        <div v-if="hasSlotContent($slots.footer)" :class="`${prefixCls}-footer`" x-semi-prop="footer">
            <slot name="footer" />
        </div>
        <slot name="loadMore" />
    </div>
</template>
