<script setup lang="ts">
    import { Text, computed, useTemplateRef, type ShallowRef, type StyleValue, type VNode } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/components/dropdown/constants';
    import DropdownFoundation, { type DropdownAdapter, type DropdownBaseState } from '@fibrae/semi-foundation/components/dropdown/foundation';
    import { cssClasses as tooltipClasses } from '@fibrae/semi-foundation/components/tooltip/constants';
    import '@fibrae/semi-foundation/components/dropdown/dropdown.scss';
    import semiDefault, { semiGlobalDefault } from '../../base/semi-default';
    import useFoundation from '../../base/use-foundation';
    import elementType from '../../utils/element-type';
    import slotNodes, { type KeyedNode } from '../../utils/slot-nodes';
    import useConfig from '../config-provider/use-config';
    import { provideTooltipPrefixContext } from '../tooltip/context';
    import type { FocusTarget, TooltipHandle, TooltipProps } from '../tooltip/interface';
    import Tooltip from '../tooltip/tooltip.vue';
    import { canCarryPopupState } from '../tooltip/trigger';
    import { menuContext, useDropdownContext, type DropdownContext } from './context';
    import DropdownDivider from './dropdown-divider.vue';
    import DropdownItem from './dropdown-item.vue';
    import DropdownMenu from './dropdown-menu.vue';
    import DropdownPopup from './dropdown-popup.vue';
    import DropdownTitle from './dropdown-title.vue';
    import type { DropdownMenuItem, DropdownEmits, DropdownHandle, DropdownProps, DropdownSlots } from './interface';

    type Foundation = DropdownFoundation<DropdownProps>;
    type Adapter = DropdownAdapter<DropdownProps>;

    // F11: no root DOM; class goes to the popup wrapper, style to the menu container, the rest is dropped.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(defineProps<DropdownProps>(), {
        closeOnEsc: () => semiDefault('Dropdown', 'closeOnEsc', true),
        motion: () => semiDefault('Dropdown', 'motion', true),
        mouseLeaveDelay: () => semiDefault('Dropdown', 'mouseLeaveDelay', strings.DEFAULT_LEAVE_DELAY),
        position: () => semiDefault('Dropdown', 'position', 'bottom'),
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

    const tooltipProps = computed<TooltipProps>(() => {
        const { contentClassName: _class, menu: _menu, selectionMode: _mode, showTick: _tick, spacing, ...shared } = props;
        return {
            ...shared,
            // the foundation handles Up and Down on the trigger; on a parent item they move within the parent menu
            disableArrowKeyDown: true,
            showArrow: false,
            spacing: DropdownFoundation.getSpacing(spacing, parent?.view.value.menuDepth),
        };
    });

    provideTooltipPrefixContext(cssClasses.PREFIX);

    const getPopupId = () => tooltip.value?.getPopupId() ?? '';

    const emitVisible = (visible: boolean) => {
        emit('update:visible', visible);
        emit('visibleChange', visible);
    };

    const { foundation, state } = useFoundation<Foundation, Adapter, DropdownProps, DropdownBaseState>(
        DropdownFoundation,
        props,
        () => DropdownFoundation.getInitialState(),
        () => ({
            notifyVisibleChange: emitVisible,
            getPopup: () => tooltip.value?.getPopup() ?? null,
            hidePopup: () => tooltip.value?.hide(),
        }),
        { context: () => menuContext(parent, config.value.direction) }
    );

    const context: DropdownContext = {
        view: computed(() => ({
            menuDepth: DropdownFoundation.getChildMenuDepth(parent?.view.value.menuDepth),
            showTick: props.showTick,
            selectionMode: props.selectionMode,
            trigger: props.trigger,
        })),
        close: foundation.close,
        closeAll: foundation.closeAll,
        getPopupId,
    };

    // Moves focus into the menu when Tooltip gives the popup its initial focus.
    const focusTarget: FocusTarget = { focus: foundation.handleOpened };

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

    const showingClass = () => ({ [`${cssClasses.PREFIX}-showing`]: popVisible() });

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

    const menuKey = (item: DropdownMenuItem, index: number) => `${item.node}${'name' in item ? (item.name ?? '') : ''}${index}`;

    const menuItemAttrs = (item: DropdownMenuItem) => {
        const { node: _node, name: _name, ...rest } = item as DropdownMenuItem & { name?: unknown };
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
        @visibleChange="foundation.handleVisibleChange"
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
            <DropdownPopup :contentClass="props.contentClassName" :context="context" :popStyle="$attrs.style as StyleValue" @vue:beforeMount="bindFocusTarget(slotProps.initialFocusRef)">
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
