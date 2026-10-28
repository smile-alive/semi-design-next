<script setup lang="ts">
    import { computed, mergeProps, toRaw, type VNode } from 'vue';
    import { cloneDeep } from 'es-toolkit';
    import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
    import ItemFoundation, { type ItemAdapter, countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import { splitControlAttrs } from '../_base/control-attrs';
    import { nativeTag } from '../_base/native-tag';
    import SlotFragment from '../_base/slot-fragment';
    import slotNodes, { hasSlotContent } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import DropdownItem from '../dropdown/dropdown-item.vue';
    import Tooltip from '../tooltip/tooltip.vue';
    import { useNav } from './context';
    import type { NavItemProps, OnSelectedData, SelectedData } from './interface';
    import { iconAttrs } from './nav-icon';

    interface ItemShellProps extends NavItemProps {
        isSubNav?: boolean;
        /** Resolved by the caller: a Sub provides isInSubNav to its own subtree, which includes this shell */
        isInSubNav?: boolean;
    }

    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<ItemShellProps>(), {
        // unset stays undefined: selectedItems report only what was passed
        disabled: undefined,
        indent: undefined,
        isCollapsed: undefined,
        isInSubNav: false,
        isSubNav: false,
        level: undefined,
    });

    // not named click: a Sub's own @click stays a native listener on the li
    const emit = defineEmits<{ itemClick: [data: SelectedData] }>();

    const slots = defineSlots<{
        content?: () => VNode[];
        icon?: () => VNode[];
        text?: () => VNode[];
        toggleIcon?: () => VNode[];
    }>();

    const ctx = useNav('Nav.Item');

    const prefix = cssClasses.PREFIX;
    const itemPrefix = `${prefix}-item`;
    const isCollapsed = computed(() => props.isCollapsed || ctx.view.value.isCollapsed);
    const horizontal = computed(() => ctx.view.value.mode === strings.MODE_HORIZONTAL);
    const popup = computed(() => props.isInSubNav && (isCollapsed.value || horizontal.value));
    const hasLink = computed(() => typeof props.link === 'string');

    // present in both states and only active while collapsed: swapping the wrapper would remount the focused control
    const tooltipped = computed(() => !props.isSubNav && !props.isInSubNav && !horizontal.value);

    const tooltipProps = computed(() => ({
        condition: isCollapsed.value,
        mouseEnterDelay: props.tooltipShowDelay ?? ctx.view.value.tooltipShowDelay,
        mouseLeaveDelay: props.tooltipHideDelay ?? ctx.view.value.tooltipHideDelay,
        position: 'right' as const,
        trigger: 'hover' as const,
        wrapWhenSpecial: false,
    }));

    const isSelected = () => props.itemKey !== undefined && ctx.view.value.selectedKeys.includes(props.itemKey);

    const selected = computed(isSelected);

    // selectedItems report what the item was given: no unset props and none of the shell's own
    const reportedProps = ({ isSubNav: _sub, isInSubNav: _in, ...rest }: ItemShellProps) => Object.fromEntries(Object.entries(toRaw(rest)).filter(([, value]) => value !== undefined));

    const { foundation } = useFoundation<ItemFoundation<ItemShellProps>, ItemAdapter<ItemShellProps>, ItemShellProps, object>(
        ItemFoundation,
        props,
        () => ({}),
        () => ({
            cloneDeep: <T>(value: T) => cloneDeep(reportedProps(value as ItemShellProps)) as T,
            selectSelf: () => ctx.updateSelectedKeys([props.itemKey as NonNullable<typeof props.itemKey>]),
            getSelectedKeysIsControlled: () => ctx.view.value.selectedKeysIsControlled,
            notifyGlobalOnSelect: (data) => ctx.notifySelect(data as OnSelectedData),
            notifyGlobalOnClick: (data) => ctx.notifyClick(data),
            notifyClick: (data) => emit('itemClick', data),
            getSelected: isSelected,
        })
    );

    // the li is a plain list item: aria-* and tabindex describe the link or button that takes focus
    const isControlKey = (key: string) => key.startsWith('aria-') || key === 'tabindex';

    const handleClick = (event: MouseEvent) => foundation.handleClick(event);

    // Dropdown activates the li on Enter/Space; click the inner link instead so target and rel apply
    // (it bubbles back here).
    const popupClick = (event: MouseEvent) => {
        const li = event.currentTarget as HTMLElement;
        const link = event.target === li && hasLink.value ? li.querySelector('a') : null;
        if (link) {
            link.click();
            return;
        }
        handleClick(event);
    };

    const rootAttrs = (attrs: Record<string, unknown>) => {
        const state = {
            [`${itemPrefix}-sub`]: props.isSubNav,
            [`${itemPrefix}-collapsed`]: isCollapsed.value,
            [`${itemPrefix}-disabled`]: props.disabled,
        };
        if (popup.value) {
            return mergeProps(attrs, {
                active: selected.value,
                'aria-current': selected.value && !props.isSubNav ? 'page' : undefined,
                class: [itemPrefix, state, { [`${itemPrefix}-selected`]: selected.value }],
                disabled: props.disabled ?? false,
                onClick: popupClick,
            });
        }
        const { class: own, ...root } = props.isSubNav ? attrs : splitControlAttrs(attrs, isControlKey).root;
        return {
            ...root,
            class: [
                own || `${itemPrefix}-normal`,
                itemPrefix,
                state,
                {
                    [`${itemPrefix}-selected`]: selected.value && !props.isSubNav,
                    [`${itemPrefix}-has-link`]: hasLink.value && !props.isSubNav,
                    [`${itemPrefix}-has-button`]: !hasLink.value && !props.isSubNav,
                },
            ],
        };
    };

    const controlTag = () => {
        if (props.isSubNav) return SlotFragment;
        if (hasLink.value) return nativeTag('a');
        return popup.value ? SlotFragment : nativeTag('button');
    };

    const controlAttrs = (attrs: Record<string, unknown>) => {
        if (props.isSubNav) return {};
        if (popup.value) {
            // the li is the menuitem, so the link inside is not a focus target of its own
            return hasLink.value ? mergeProps({ class: `${prefix}-item-link`, href: props.link, tabindex: -1 }, { ...props.linkOptions }) : {};
        }
        const own = {
            'aria-current': selected.value ? 'page' : undefined,
            // a disabled item stays focusable so that it can be found; the foundation ignores its activation
            'aria-disabled': props.disabled || undefined,
            onClick: handleClick,
        };
        const { control } = splitControlAttrs(attrs, isControlKey);
        return hasLink.value ? mergeProps({ class: `${prefix}-item-link`, href: props.link }, { ...props.linkOptions }, control, own) : mergeProps({ class: `${prefix}-item-button`, type: 'button' }, control, own);
    };

    const iconNodes = () => slotNodes(slots.icon?.() ?? []);

    const toggleNodes = () => slotNodes(slots.toggleIcon?.() ?? []);

    const iconClass = (toggle: boolean) => [`${itemPrefix}-icon`, toggle ? `${itemPrefix}-icon-toggle-${ctx.view.value.toggleIconPosition}` : `${itemPrefix}-icon-info`];

    const placeholders = () =>
        countPlaceholderIcons({
            mode: ctx.view.value.mode,
            limitIndent: ctx.view.value.limitIndent,
            isCollapsed: isCollapsed.value,
            hasIcon: hasSlotContent(slots.icon),
            indent: props.indent ?? false,
            level: props.level ?? 0,
        });

    const toggleShown = (position: 'left' | 'right') => ctx.view.value.toggleIconPosition === position && (!horizontal.value || hasSlotContent(slots.toggleIcon));

    const infoIconShown = () => {
        const hasIcon = hasSlotContent(slots.icon);
        return Boolean(hasIcon || props.indent || props.isInSubNav) && (!horizontal.value || hasIcon);
    };
</script>

<template>
    <component :is="popup ? DropdownItem : 'li'" v-bind="rootAttrs($attrs)">
        <component :is="tooltipped ? Tooltip : SlotFragment" v-bind="tooltipped ? tooltipProps : {}">
            <component :is="controlTag()" v-bind="controlAttrs($attrs)">
                <slot v-if="$slots.content" name="content" />
                <template v-else>
                    <i v-for="n in placeholders()" :key="`placeholder-${n}`" :class="iconClass(false)" />
                    <i v-if="toggleShown('left')" :class="iconClass(true)">
                        <component :is="node" v-for="[node, key] in toggleNodes()" :key="key" v-bind="iconAttrs(node, 'default')" />
                    </i>
                    <i v-if="infoIconShown()" :class="iconClass(false)">
                        <component :is="node" v-for="[node, key] in iconNodes()" :key="key" v-bind="iconAttrs(node, 'large')" />
                    </i>
                    <span v-if="props.text != null || $slots.text" :class="`${prefix}-item-text`">
                        <slot name="text">{{ props.text }}</slot>
                    </span>
                    <i v-if="toggleShown('right')" :class="iconClass(true)">
                        <component :is="node" v-for="[node, key] in toggleNodes()" :key="key" v-bind="iconAttrs(node, 'default')" />
                    </i>
                </template>
            </component>
            <template #content>
                <slot name="text">{{ props.text }}</slot>
            </template>
        </component>
    </component>
</template>
