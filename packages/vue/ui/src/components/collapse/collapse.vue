<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/components/collapse/constants';
    import CollapseFoundation, { type CollapseAdapter, type CollapseProps as FoundationProps, type CollapseState } from '@fibrae/semi-foundation/components/collapse/foundation';
    import '@fibrae/semi-foundation/components/collapse/collapse.scss';
    import type { ElementProps, EmitHandlers } from '../../base/element-props';
    import semiDefault, { readSemiDefault, semiGlobalDefault, useSemiGlobal } from '../../base/semi-default';
    import useFoundation from '../../base/use-foundation';
    import { provideCollapseContext, type CollapseView } from './context';
    import type { CollapseEmits, CollapseProps, CollapseSlots } from './interface';

    type Foundation = CollapseFoundation<MouseEvent>;
    type Adapter = CollapseAdapter<MouseEvent>;

    const props = withDefaults(defineProps<CollapseProps & /* @vue-ignore */ ElementProps<'div', keyof CollapseProps | EmitHandlers<CollapseEmits>>>(), {
        activeKey: undefined,
        defaultActiveKey: () => semiDefault('Collapse', 'defaultActiveKey', ''),
        accordion: semiGlobalDefault('Collapse', 'accordion'),
        clickHeaderToExpand: () => semiDefault('Collapse', 'clickHeaderToExpand', true),
        expandIconPosition: () => semiDefault('Collapse', 'expandIconPosition', 'right'),
        keepDOM: semiGlobalDefault('Collapse', 'keepDOM'),
        motion: semiGlobalDefault('Collapse', 'motion'),
        lazyRender: () => semiDefault('Collapse', 'lazyRender', false),
    });

    const emit = defineEmits<CollapseEmits>();

    // A panel reads the icon slots from this object at render time. Known limitation: a consumer that adds or removes
    // a whole #expandIcon or #collapseIcon slot with v-if re-renders Collapse but not necessarily its panels, so a
    // panel can keep the old icon. Upgrade: count onBeforeUpdate and put the count in the view.
    const slots = defineSlots<CollapseSlots>();

    const semi = useSemiGlobal();

    const { foundation, state } = useFoundation<Foundation, Adapter, FoundationProps, CollapseState>(
        CollapseFoundation,
        props,
        (view) => CollapseFoundation.getInitialState(view),
        () => ({
            notifyChange: (activeKey, event) => {
                emit('update:activeKey', activeKey);
                emit('change', activeKey, event);
            },
        })
    );

    provideCollapseContext({
        view: computed<CollapseView>(() => ({
            activeSet: CollapseFoundation.deriveActiveSet(props, state.value),
            clickHeaderToExpand: props.clickHeaderToExpand,
            // Resolved here, not in Collapsible, so a panel's aria-controls follows the same value as the content it points at.
            keepDOM: props.keepDOM ?? readSemiDefault(semi, 'Collapsible', 'keepDOM', false),
            motion: props.motion ?? readSemiDefault(semi, 'Collapsible', 'motion', true),
            lazyRender: props.lazyRender,
            expandIconPosition: props.expandIconPosition,
        })),
        slots,
        onClick: foundation.handleChange,
    });
</script>

<template>
    <div :class="cssClasses.PREFIX">
        <slot />
    </div>
</template>
