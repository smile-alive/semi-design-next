<script setup lang="ts">
    import { Text, type VNode } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/navigation/constants';
    import { IconSidebar } from '@fibrae/semi-icons-vue';
    import slotNodes from '../_base/slot-nodes';
    import Button from '../button/button.vue';
    import useLocale from '../locale/use-locale';
    import Tooltip from '../tooltip/tooltip.vue';
    import type { NavCollapseButtonProps, NavCollapseTextSlotProps } from './interface';

    const props = defineProps<NavCollapseButtonProps>();
    const emit = defineEmits<{ toggle: [] }>();
    const slots = defineSlots<{ collapseText?: (props: NavCollapseTextSlotProps) => VNode[] }>();

    const locale = useLocale('Navigation');

    // only the icon shows while collapsed, so the button is named by a text-only #collapseText or the locale text
    const label = () => {
        const nodes = slotNodes(slots.collapseText?.({ collapsed: props.collapsed }) ?? []);
        const [only] = nodes.length === 1 ? nodes[0] : [];
        return only?.type === Text ? String(only.children).trim() : locale.value.locale.expandText;
    };
</script>

<template>
    <div :class="`${cssClasses.PREFIX}-collapse-btn`">
        <!-- One element tree for both states: swapping the wrapper would remount the button and drop the focus it holds -->
        <Tooltip :condition="props.collapsed" position="right">
            <Button :aria-label="props.collapsed ? label() : undefined" theme="borderless" type="tertiary" @click="emit('toggle')">
                <template #icon>
                    <IconSidebar />
                </template>
                <template v-if="!props.collapsed" #default>
                    <slot :collapsed="props.collapsed" name="collapseText">{{ locale.locale.collapseText }}</slot>
                </template>
            </Button>
            <template #content>
                <slot :collapsed="props.collapsed" name="collapseText">{{ locale.locale.expandText }}</slot>
            </template>
        </Tooltip>
    </div>
</template>
