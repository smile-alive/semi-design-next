<script setup lang="ts">
    import type { NavItemType } from '@fibrae/semi-foundation/navigation/foundation';
    import type { NavItemConfig, NavItemSlotProps, NavSlots, SubDropdownProps } from './interface';
    import NavItem from './nav-item.vue';
    import SubNav from './sub-nav.vue';

    // the template recurses by file name; naming it keeps a same-named app registration from taking over
    defineOptions({ name: 'NavItems' });
    const props = defineProps<{ items: NavItemType[]; level: number; subDropdownProps?: SubDropdownProps }>();
    defineSlots<Pick<NavSlots, 'icon' | 'text' | 'toggleIcon' | 'expandIcon'>>();

    const ITEM_KEYS = new Set(['itemKey', 'text', 'disabled', 'indent', 'link', 'linkOptions', 'tooltipShowDelay', 'tooltipHideDelay']);
    const SUB_KEYS = new Set(['itemKey', 'text', 'disabled', 'indent', 'dropdownStyle', 'dropdownProps']);
    const LI_KEYS = new Set(['class', 'style', 'onMouseenter', 'onMouseleave']);

    // An entry may carry app data (e.g. `path`); only the declared keys, li attributes, data-* and aria-* reach the item
    const pick = (item: NavItemType, keys: ReadonlySet<string>) => Object.fromEntries(Object.entries(item).filter(([key]) => keys.has(key) || LI_KEYS.has(key) || /^(data|aria)-/.test(key)));

    const isSub = (item: NavItemType) => Array.isArray(item.items) && item.items.length > 0;

    const slotProps = (item: NavItemType): NavItemSlotProps => ({ item: item as NavItemConfig, level: props.level });
</script>

<template>
    <!-- 0 and '' are valid keys -->
    <template v-for="(item, index) in props.items" :key="item.itemKey ?? `${props.level}${index}`">
        <SubNav v-if="isSub(item)" v-bind="pick(item, SUB_KEYS)" :level="props.level" :subDropdownProps="props.subDropdownProps">
            <NavItems :items="item.items!" :level="props.level + 1" :subDropdownProps="props.subDropdownProps">
                <template v-if="$slots.icon" #icon="p">
                    <slot v-bind="p" name="icon" />
                </template>
                <template v-if="$slots.text" #text="p">
                    <slot v-bind="p" name="text" />
                </template>
                <template v-if="$slots.toggleIcon" #toggleIcon="p">
                    <slot v-bind="p" name="toggleIcon" />
                </template>
                <template v-if="$slots.expandIcon" #expandIcon="p">
                    <slot v-bind="p" name="expandIcon" />
                </template>
            </NavItems>
            <template v-if="$slots.icon" #icon>
                <slot v-bind="slotProps(item)" name="icon" />
            </template>
            <template v-if="$slots.text" #text>
                <slot v-bind="slotProps(item)" name="text" />
            </template>
            <template v-if="$slots.expandIcon" #expandIcon>
                <slot v-bind="slotProps(item)" name="expandIcon" />
            </template>
        </SubNav>
        <NavItem v-else v-bind="pick(item, ITEM_KEYS)" :level="props.level">
            <template v-if="$slots.icon" #icon>
                <slot v-bind="slotProps(item)" name="icon" />
            </template>
            <template v-if="$slots.text" #text>
                <slot v-bind="slotProps(item)" name="text" />
            </template>
            <template v-if="$slots.toggleIcon" #toggleIcon>
                <slot v-bind="slotProps(item)" name="toggleIcon" />
            </template>
        </NavItem>
    </template>
</template>
