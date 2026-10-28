<script setup lang="ts">
    import { computed } from 'vue';
    import type { ElementProps } from '../_base/element-props';
    import { Col } from '../grid';
    import { useListContext } from './context';
    import type { ListItemProps, ListItemSlots } from './interface';
    import ItemLi from './item-li.vue';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<ListItemProps & /* @vue-ignore */ ElementProps<'li', keyof ListItemProps>>();
    const slots = defineSlots<ListItemSlots>();

    const list = useListContext();

    // The grid's class is typed `unknown`, which a typed Col would reject, hence the loose record.
    const colProps = computed((): Record<string, unknown> | undefined => {
        const grid = list?.value.grid;
        if (!grid) return undefined;
        const { gutter, justify, type, align, ...rest } = grid;
        return { ...rest, role: 'none' };
    });

    // default is rendered by the plain <slot /> below
    const passedSlots = () => Object.keys(slots).filter((name) => name !== 'default');
</script>

<template>
    <Col v-if="colProps" v-bind="colProps">
        <ItemLi v-bind="{ ...$attrs, ...props }">
            <template v-for="name in passedSlots()" #[name]="scope">
                <slot :name="name as keyof ListItemSlots" v-bind="scope" />
            </template>
            <slot />
        </ItemLi>
    </Col>
    <ItemLi v-else v-bind="{ ...$attrs, ...props }">
        <template v-for="name in passedSlots()" #[name]="scope">
            <slot :name="name as keyof ListItemSlots" v-bind="scope" />
        </template>
        <slot />
    </ItemLi>
</template>
