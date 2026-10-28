<script setup lang="ts">
    import { Text, computed, useTemplateRef, type ShallowRef, type StyleValue, type VNode } from 'vue';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/dropdown/constants';
    import DropdownFoundation, { type DropdownAdapter, type DropdownBaseState } from '@fibrae/semi-foundation/dropdown/foundation';
    import { cssClasses as tooltipClasses } from '@fibrae/semi-foundation/tooltip/constants';
    import '@fibrae/semi-foundation/dropdown/dropdown.scss';
    import elementType from '../_base/element-type';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import slotNodes, { type KeyedNode } from '../_base/slot-nodes';
    import useFoundation from '../_base/use-foundation';
    import useConfig from '../config-provider/use-config';
    import type { FocusTarget, TooltipHandle, TooltipProps } from '../tooltip/interface';
    import Tooltip from '../tooltip/tooltip.vue';
    import { canCarryPopupState } from '../tooltip/trigger';
    import { menuContext, useDropdownContext, type DropdownContext } from './context';
    import DropdownDivider from './dropdown-divider.vue';
    import DropdownItem from './dropdown-item.vue';
    import DropdownMenu from './dropdown-menu.vue';
    import DropdownPopup from './dropdown-popup.vue';
    import DropdownTitle from './dropdown-title.vue';
    import type { DropDownMenuItem, DropdownEmits, DropdownHandle, DropdownProps, DropdownSlots } from './interface';

    type Foundation = DropdownFoundation<DropdownProps, DropdownBaseState>;
    type Adapter = DropdownAdapter<DropdownProps, DropdownBaseState>;

    // F11: no root DOM; class goes to the popup wrapper, style to the menu container, the rest is dropped.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<DropdownProps>(), {
        closeOnEsc: () => semiDefault('Dropdown', 'closeOnEsc', true),
        motion: () => semiDefault('Dropdown', 'motion', true),
        mouseLeaveDelay: () => semiDefault('Dropdown', 'mouseLeaveDelay', strings.DEFAULT_LEAVE_DELAY),
        position: () => semiDefault('Dropdown', 'position', 'bottom'),
        prefixCls: () => semiDefault('Dropdown', 'prefixCls', cssClasses.PREFIX),
        returnFocusOnClose: () => semiDefault('Dropdown', 'returnFocusOnClose', true),
        // an interactive menu must not sit inside role="tooltip"
        role: () => semiDefault('Dropdown', 'role', 'presentation'),
        showTick: () => semiDefault('Dropdown', 'showTick', false),
        trigger: () => semiDefault('Dropdown', 'trigger', 'hover'),
        contentClassName: semiGlobalDefault('Dropdown', 'contentClassName'),
        menu: semiGlobalDefault('Dropdown', 'menu'),
        selectionMode: semiGlobalDefault('Dropdown', 'selectionMode'),
        spacing: semiGlobalDefault('Dropdown', 'spacing'),
        visible: semiGlobalDefault('Dropdown', 'visible'),
        ariaDescribedby: semiGlobalDefault('Dropdown', 'ariaDescribedby'),
        ariaLabel: semiGlobalDefault('Dropdown', 'ariaLabel'),
        ariaLabelledby: semiGlobalDefault('Dropdown', 'ariaLabelledby'),
        autoAdjustOverflow: semiGlobalDefault('Dropdown', 'autoAdjustOverflow'),
        clickToHide: semiGlobalDefault('Dropdown', 'clickToHide'),
        clickTriggerToHide: semiGlobalDefault('Dropdown', 'clickTriggerToHide'),
        condition: semiGlobalDefault('Dropdown', 'condition'),
        disableFocusListener: semiGlobalDefault('Dropdown', 'disableFocusListener'),
        guardFocus: semiGlobalDefault('Dropdown', 'guardFocus'),
        keepDOM: semiGlobalDefault('Dropdown', 'keepDOM'),
        mouseEnterDelay: semiGlobalDefault('Dropdown', 'mouseEnterDelay'),
        preventScroll: semiGlobalDefault('Dropdown', 'preventScroll'),
        stopPropagation: semiGlobalDefault('Dropdown', 'stopPropagation'),
        wrapWhenSpecial: semiGlobalDefault('Dropdown', 'wrapWhenSpecial'),
        wrapperClassName: semiGlobalDefault('Dropdown', 'wrapperClassName'),
        wrapperId: undefined,
    });

    const emit = defineEmits<DropdownEmits>();
    const slots = defineSlots<DropdownSlots>();

    const parent = useDropdownContext();
    const config = useConfig();

    // Inferred, the ref type loops through foundation back into the template bindings (TS7022).
    const tooltip = useTemplateRef<TooltipHandle>('tooltip');
    const popup = useTemplateRef<{ $el: Element }>('popup');

    const tooltipProps = computed<TooltipProps>(() => {
        const { contentClassName: _class, menu: _menu, selectionMode: _mode, showTick: _tick, spacing, ...shared } = props;
        const isSubmenu = (parent?.view.value.menuDepth ?? 0) > 0;
        return {
            ...shared,
            // the foundation handles Up and Down on the trigger; on a parent item they move within the parent menu
            disableArrowKeyDown: true,
            showArrow: false,
            spacing: spacing ?? (isSubmenu ? numbers.NESTED_SPACING : numbers.SPACING),
        };
    });

    const getPopupId = () => tooltip.value?.getPopupId() ?? '';

    const emitVisible = (visible: boolean) => {
        emit('update:visible', visible);
        emit('visibleChange', visible);
    };

    const { foundation, state } = useFoundation<Foundation, Adapter, DropdownProps, DropdownBaseState>(
        DropdownFoundation,
        props,
        () => ({ popVisible: false }),
        (base) => ({
            setPopVisible: (popVisible) => base.setState({ popVisible }),
            notifyVisibleChange: emitVisible,
            getPopup: () => popup.value?.$el.closest<HTMLElement>('[popover]') ?? null,
            hidePopup: () => tooltip.value?.hide(),
        }),
        { context: () => menuContext(parent, config.value.direction) }
    );

    const context: DropdownContext = {
        view: computed(() => ({
            menuDepth: (parent?.view.value.menuDepth ?? 0) + 1,
            showTick: props.showTick,
            selectionMode: props.selectionMode,
            trigger: props.trigger,
        })),
        close: () => foundation.close(),
        closeAll: () => {
            foundation.close();
            parent?.closeAll();
        },
        getPopupId,
    };

    // Moves focus into the menu when Tooltip gives the popup its initial focus.
    const focusTarget: FocusTarget = { focus: () => foundation.handleOpened() };

    const bindFocusTarget = (focusRef: ShallowRef<FocusTarget | null>) => {
        focusRef.value = focusTarget;
    };

    const triggerNodes = () => slotNodes(slots.default?.() ?? []);

    // A disabled parent item opens no submenu, and a wrapper span would not be a valid child of the menu.
    const tooltipBindings = () => {
        const nodes = triggerNodes();
        const node = nodes.length === 1 && elementType(nodes[0][0]) === 'Dropdown.Item' ? nodes[0][0] : undefined;
        if (!node) return tooltipProps.value;
        const disabled = node.props?.disabled === '' || node.props?.disabled === true;
        return {
            ...tooltipProps.value,
            ...(props.wrapWhenSpecial === undefined && { wrapWhenSpecial: false }),
            ...(disabled && props.condition === undefined && { condition: false }),
        };
    };

    // Tooltip wraps text or several nodes in its own span, out of reach of the keydown; render that span here instead.
    const wrapsTrigger = (nodes: KeyedNode[]) => nodes.length !== 1 || nodes[0][0].type === Text;

    const popVisible = () => props.visible ?? state.value.popVisible;

    const showingClass = () => ({ [`${props.prefixCls}-showing`]: popVisible() });

    const triggerAttrs = (node: VNode) => {
        const menuButton = elementType(node) === 'Dropdown.Item' || canCarryPopupState(node);
        return {
            class: showingClass(),
            // undefined also drops a value the child set itself
            'aria-haspopup': menuButton ? 'menu' : undefined,
            'aria-expanded': menuButton ? popVisible() : undefined,
            // runs after the child's keydown, whose preventDefault stops a second click
            onKeydown: (event: KeyboardEvent) => foundation.handleKeyDown(event, menuButton),
        };
    };

    const menuKey = (item: DropDownMenuItem, index: number) => `${item.node}${'name' in item ? (item.name ?? '') : ''}${index}`;

    const menuItemAttrs = (item: DropDownMenuItem) => {
        const { node: _node, name: _name, ...rest } = item as DropDownMenuItem & { name?: unknown };
        return rest;
    };

    defineExpose<DropdownHandle>({
        focusTrigger: () => tooltip.value?.focusTrigger(),
        rePosition: () => tooltip.value?.rePosition(),
    });
</script>

<template>
    <Tooltip
        ref="tooltip"
        v-bind="tooltipBindings()"
        :class="$attrs.class"
        @afterClose="(...args) => emit('afterClose', ...args)"
        @afterOpen="emit('afterOpen')"
        @clickOutSide="(...args) => emit('clickOutSide', ...args)"
        @escKeyDown="(...args) => emit('escKeyDown', ...args)"
        @open="emit('open')"
        @visibleChange="foundation.handleVisibleChange($event)"
    >
        <template v-for="(nodes, i) in [triggerNodes()]" :key="i">
            <span v-if="wrapsTrigger(nodes)" :class="[`${tooltipClasses.PREFIX}-trigger-wrapper`, props.wrapperClassName, showingClass()]" :style="{ display: nodes.length > 1 ? 'inline-block' : undefined }" @keydown="foundation.handleKeyDown($event, false)">
                <component :is="node" v-for="[node, key] in nodes" :key="key" />
            </span>
            <template v-else>
                <component :is="node" v-for="[node, key] in nodes" :key="key" v-bind="triggerAttrs(node)" />
            </template>
        </template>
        <template #content="slotProps">
            <DropdownPopup ref="popup" :contentClass="props.contentClassName" :context="context" :popStyle="$attrs.style as StyleValue" :prefixCls="props.prefixCls" @vue:beforeMount="bindFocusTarget(slotProps.initialFocusRef)">
                <slot v-if="$slots.content" name="content" />
                <DropdownMenu v-else-if="Array.isArray(props.menu)">
                    <template v-for="(item, index) in props.menu" :key="menuKey(item, index)">
                        <DropdownTitle v-if="item.node === 'title'" v-bind="menuItemAttrs(item)">
                            {{ item.name }}
                        </DropdownTitle>
                        <DropdownItem v-else-if="item.node === 'item'" v-bind="menuItemAttrs(item)">
                            {{ item.name }}
                            <template v-if="$slots.menuIcon" #icon>
                                <slot :index="index" :item="item" name="menuIcon" />
                            </template>
                        </DropdownItem>
                        <DropdownDivider v-else-if="item.node === 'divider'" v-bind="menuItemAttrs(item)" />
                    </template>
                </DropdownMenu>
            </DropdownPopup>
        </template>
    </Tooltip>
</template>
