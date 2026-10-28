<script setup lang="ts">
    import { computed, mergeProps, useId, useTemplateRef } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/navigation/constants';
    import { countPlaceholderIcons } from '@fibrae/semi-foundation/navigation/item-foundation';
    import SubNavFoundation, { type SubNavAdapter } from '@fibrae/semi-foundation/navigation/sub-nav-foundation';
    import '@fibrae/semi-foundation/navigation/navigation.scss';
    import { IconChevronDown, IconChevronRight } from '@fibrae/semi-icons-vue';
    import { isAriaKey, splitControlAttrs } from '../_base/control-attrs';
    import type { ElementProps } from '../_base/element-props';
    import { nativeTag } from '../_base/native-tag';
    import SlotFragment from '../_base/slot-fragment';
    import slotNodes, { hasSlotContent } from '../_base/slot-nodes';
    import useFocusHandover from '../_base/use-focus-handover';
    import useFoundation from '../_base/use-foundation';
    import Collapsible from '../collapsible/collapsible.vue';
    import DropdownMenu from '../dropdown/dropdown-menu.vue';
    import Dropdown from '../dropdown/dropdown.vue';
    import Tooltip from '../tooltip/tooltip.vue';
    import { provideNavContext, useNav } from './context';
    import type { ItemKey, SubNavProps, SubNavSlots } from './interface';
    import ItemShell from './item-shell.vue';
    import { iconAttrs } from './nav-icon';
    import WrapperOutlet from './wrapper-outlet.vue';

    // aria-* describe the title, which takes focus; the rest reaches the wrapper li
    defineOptions({ inheritAttrs: false, elementType: 'Nav.Sub' });

    const props = withDefaults(defineProps<SubNavProps & /* @vue-ignore */ ElementProps<'li', keyof SubNavProps>>(), {
        // left undefined so that #wrapper receives only what was passed
        disabled: undefined,
        // StyleValue admits false, so Vue would cast an absent prop to false
        dropdownStyle: undefined,
        indent: undefined,
        level: undefined,
    });

    const slots = defineSlots<SubNavSlots>();

    const outer = useNav('Nav.Sub');

    const subListId = useId();

    // Collapsing or expanding the nav swaps the title's wrapper (inline disclosure button <-> popup trigger), which remounts
    // it; focus follows to the new title
    const shell = useTemplateRef('shell');

    const view = outer.view;
    const prefix = cssClasses.PREFIX;
    const isOpen = computed(() => props.itemKey !== undefined && view.value.openKeys.includes(props.itemKey));

    const { foundation } = useFoundation<SubNavFoundation<SubNavProps>, SubNavAdapter<SubNavProps>, SubNavProps, object>(
        SubNavFoundation,
        props,
        () => ({}),
        () => ({
            getOpenKeys: () => view.value.openKeys,
            getOpenKeysIsControlled: () => view.value.openKeysIsControlled,
            updateOpen: (open) => (open ? outer.addOpenKey : outer.removeOpenKey)(props.itemKey as ItemKey),
            notifyGlobalOpenChange: (data) => outer.notifyOpenChange(data),
            notifyGlobalOnClick: (data) => outer.notifyClick(data),
            getIsOpen: () => isOpen.value,
        })
    );

    const handoverFocus = useFocusHandover(() => (shell.value?.$el as HTMLElement | undefined)?.querySelector<HTMLElement>(`.${prefix}-sub-title`));

    const isSelected = computed(() => props.itemKey !== undefined && view.value.selectedKeys.includes(props.itemKey));
    const horizontal = computed(() => view.value.mode === strings.MODE_HORIZONTAL);
    const isPopup = computed(() => view.value.isCollapsed || horizontal.value);

    // inside a popup menu the title is the menuitem that opens a submenu
    const menuTitle = computed(() => isPopup.value && view.value.isInSubNav);

    // A disabled Sub opens no Dropdown; collapsed, it shows its hidden text in a tooltip instead
    const titleWrapper = computed(() => {
        if (view.value.isCollapsed && props.disabled) return Tooltip;
        return isPopup.value && !props.disabled ? Dropdown : SlotFragment;
    });

    const titleWrapperAttrs = computed(() => {
        if (titleWrapper.value === Tooltip) {
            return {
                mouseEnterDelay: view.value.tooltipShowDelay,
                mouseLeaveDelay: view.value.tooltipHideDelay,
                position: 'right',
                trigger: 'hover',
                wrapWhenSpecial: false,
            };
        }
        if (titleWrapper.value === SlotFragment) return {};
        // Defaults first: user dropdownProps win, dropdownStyle beats their style, our onVisibleChange runs first
        return mergeProps(
            {
                class: { [`${prefix}-popover`]: view.value.isCollapsed },
                mouseEnterDelay: view.value.subNavOpenDelay,
                mouseLeaveDelay: view.value.subNavCloseDelay,
                position: horizontal.value && !view.value.isInSubNav ? 'bottomLeft' : 'rightTop',
                trigger: 'hover',
                onVisibleChange: (visible: boolean) => foundation.handleDropdownVisibleChange(visible),
            },
            { ...(props.dropdownProps ?? props.subDropdownProps) },
            props.dropdownStyle === undefined ? {} : { style: props.dropdownStyle }
        );
    });

    const subListWrapperAttrs = computed(() => (view.value.subNavMotion ? { fade: true, isOpen: isOpen.value, keepDOM: false, motion: true } : {}));

    // the shell li belongs to the enclosing list, so it gets the outer value
    provideNavContext({ ...outer, view: computed(() => ({ ...outer.view.value, isInSubNav: true })) });

    const handleClick = (event: MouseEvent) => (isPopup.value ? foundation.handlePopupClick(event) : foundation.handleClick(event));

    const titleAttrs = (attrs: Record<string, unknown>) => {
        const own = {
            class: [
                `${prefix}-sub-title`,
                {
                    [`${prefix}-sub-title-selected`]: isSelected.value,
                    [`${prefix}-sub-title-disabled`]: props.disabled,
                },
            ],
            onClick: handleClick,
        };
        const { control } = splitControlAttrs(attrs, isAriaKey);
        if (menuTitle.value) {
            // Dropdown adds aria-haspopup and aria-expanded, and moves focus to it with the arrow keys
            return {
                ...control,
                ...own,
                'aria-disabled': props.disabled ?? false,
                role: 'menuitem',
                tabindex: -1,
            };
        }
        // APG disclosure navigation; a popup title is a menu button whose aria-haspopup/aria-expanded come from Dropdown
        return {
            ...control,
            ...own,
            // Dropdown only treats a native-tag component as a menu button when it carries a popup role
            role: isPopup.value ? 'button' : undefined,
            type: 'button',
            // the list is unmounted while closed, so an id reference to it only exists when it is open
            'aria-controls': !isPopup.value && isOpen.value ? subListId : undefined,
            'aria-disabled': props.disabled || undefined,
            'aria-expanded': isPopup.value ? undefined : isOpen.value,
        };
    };

    const iconClass = (toggle: boolean) => [`${prefix}-item-icon`, toggle ? `${prefix}-item-icon-toggle-${view.value.toggleIconPosition}` : `${prefix}-item-icon-info`];

    const placeholders = () =>
        countPlaceholderIcons({
            mode: view.value.mode,
            limitIndent: view.value.limitIndent,
            isCollapsed: view.value.isCollapsed,
            hasIcon: hasSlotContent(slots.icon),
            indent: props.indent ?? false,
            level: props.level ?? 0,
        });

    const infoIconShown = () => hasSlotContent(slots.icon) || Boolean(props.indent) || (view.value.isInSubNav && !horizontal.value);

    const defaultToggle = () => {
        if (view.value.isCollapsed) return view.value.isInSubNav ? IconChevronRight : null;
        if (horizontal.value && view.value.isInSubNav) return IconChevronRight;
        return hasSlotContent(slots.expandIcon) ? null : IconChevronDown;
    };

    const customToggle = () => !view.value.isCollapsed && !(horizontal.value && view.value.isInSubNav) && hasSlotContent(slots.expandIcon);

    const rotateClass = () => (!view.value.isCollapsed && !horizontal.value && view.value.subNavMotion ? `${prefix}-icon-rotate-${isOpen.value ? '180' : '0'}` : undefined);

    const expandNodes = () => slotNodes(slots.expandIcon?.() ?? []);

    const iconNodes = () => slotNodes(slots.icon?.() ?? []);
</script>

<template>
    <WrapperOutlet :isInSubNav="view.isInSubNav" isSubNav :itemProps="props">
        <ItemShell ref="shell" v-bind="splitControlAttrs($attrs, isAriaKey).root" :class="{ [`${prefix}-sub-wrap`]: !(view.isInSubNav && isPopup) }" :disabled="props.disabled" :isCollapsed="view.isCollapsed" :isInSubNav="view.isInSubNav" isSubNav :itemKey="props.itemKey" :text="props.text">
            <template #content>
                <component :is="titleWrapper" v-bind="titleWrapperAttrs">
                    <component :is="nativeTag(menuTitle ? 'div' : 'button')" :ref="handoverFocus" v-bind="titleAttrs($attrs)">
                        <!-- a span: the title is a button, which only takes phrasing content -->
                        <span :class="`${prefix}-item-inner`">
                            <i v-for="n in placeholders()" :key="`placeholder-${n}`" :class="iconClass(false)" />
                            <i v-if="view.toggleIconPosition === 'left'" :class="iconClass(true)">
                                <template v-if="customToggle()">
                                    <component :is="node" v-for="[node, key] in expandNodes()" :key="key" v-bind="iconAttrs(node, 'default', rotateClass())" />
                                </template>
                                <component :is="defaultToggle()" v-else-if="defaultToggle()" :class="rotateClass()" />
                            </i>
                            <i v-if="infoIconShown()" :class="iconClass(false)">
                                <component :is="node" v-for="[node, key] in iconNodes()" :key="key" v-bind="iconAttrs(node, 'large')" />
                            </i>
                            <span :class="`${prefix}-item-text`">
                                <slot name="text">{{ props.text }}</slot>
                            </span>
                            <i v-if="view.toggleIconPosition === 'right'" :class="iconClass(true)">
                                <template v-if="customToggle()">
                                    <component :is="node" v-for="[node, key] in expandNodes()" :key="key" v-bind="iconAttrs(node, 'default', rotateClass())" />
                                </template>
                                <component :is="defaultToggle()" v-else-if="defaultToggle()" :class="rotateClass()" />
                            </i>
                        </span>
                    </component>
                    <template #content>
                        <DropdownMenu v-if="titleWrapper === Dropdown">
                            <slot />
                        </DropdownMenu>
                        <slot v-else name="text">{{ props.text }}</slot>
                    </template>
                </component>
                <component :is="view.subNavMotion ? Collapsible : SlotFragment" v-if="!horizontal" v-bind="subListWrapperAttrs">
                    <ul v-if="!view.isCollapsed && (view.subNavMotion || isOpen)" :id="subListId" :class="[`${prefix}-sub`, { [`${prefix}-sub-open`]: isOpen, [`${prefix}-sub-popover`]: isPopup }]">
                        <slot />
                    </ul>
                </component>
            </template>
        </ItemShell>
    </WrapperOutlet>
</template>
