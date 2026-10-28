<script setup lang="ts">
    import { Text, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/empty/constants';
    import '@fibrae/semi-foundation/empty/empty.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import { TypographyTitle } from '../typography';
    import type { EmptyProps, EmptySlots } from './interface';
    import useThemeMode from './use-theme-mode';

    const props = withDefaults(defineProps<EmptyProps & /* @vue-ignore */ ElementProps<'div', keyof EmptyProps>>(), {
        layout: () => semiDefault('Empty', 'layout', 'vertical'),
        imageStyle: semiGlobalDefault('Empty', 'imageStyle'),
        title: semiGlobalDefault('Empty', 'title'),
        image: semiGlobalDefault('Empty', 'image'),
        darkModeImage: semiGlobalDefault('Empty', 'darkModeImage'),
    });

    const slots = defineSlots<EmptySlots>();

    const themeMode = useThemeMode();

    const prefixCls = cssClasses.PREFIX;

    const nodesOf = (slot?: () => VNode[]): KeyedNode[] => slotNodes(slot?.() ?? []).filter(([node]) => !(node.type === Text && node.children === ''));

    const resolve = () => {
        const dark = themeMode.value === 'dark' && Boolean(slots.darkModeImage || props.darkModeImage);
        const nodes = nodesOf(dark ? slots.darkModeImage : slots.image);
        const value = dark ? props.darkModeImage : props.image;
        // an empty URL is no image; a URL image is decorative (`alt=""`) since title and description describe it
        const src = !nodes.length && typeof value === 'string' && value ? value : undefined;
        const sprite = !nodes.length && typeof value === 'object' && value ? value.id : undefined;
        return {
            image: { nodes, src, sprite, present: Boolean(nodes.length || src || sprite) },
            title: nodesOf(slots.title),
            description: nodesOf(slots.description),
            footer: nodesOf(slots.default),
        };
    };
</script>

<template>
    <div :class="[prefixCls, { [`${prefixCls}-${props.layout}`]: props.layout }]">
        <template v-for="(view, i) in [resolve()]" :key="i">
            <div :class="`${prefixCls}-image`" :style="props.imageStyle" x-semi-prop="image,darkModeImage">
                <component :is="node" v-for="[node, key] in view.image.nodes" :key="key" />
                <img v-if="view.image.src" alt="" :src="view.image.src" />
                <svg v-else-if="view.image.sprite" aria-hidden="true"><use :href="`#${view.image.sprite}`" /></svg>
            </div>
            <div :class="`${prefixCls}-content`">
                <!-- styled as a heading but not one: a fixed level would break the page outline -->
                <TypographyTitle v-if="view.title.length || props.title" :class="`${prefixCls}-title`" component="div" :heading="view.image.present ? 4 : 6" :style="view.image.present ? undefined : { fontWeight: 400 }" x-semi-prop="title">
                    <component :is="node" v-for="[node, key] in view.title" :key="key" />
                    <template v-if="!view.title.length">{{ props.title }}</template>
                </TypographyTitle>
                <div v-if="view.description.length" :class="`${prefixCls}-description`" x-semi-prop="description">
                    <component :is="node" v-for="[node, key] in view.description" :key="key" />
                </div>
                <div v-if="view.footer.length" :class="`${prefixCls}-footer`" x-semi-prop="children">
                    <component :is="node" v-for="[node, key] in view.footer" :key="key" />
                </div>
            </div>
        </template>
    </div>
</template>
