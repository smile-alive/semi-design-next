<script setup lang="ts">
    import type { ClassValue, StyleValue } from 'vue';
    import { cssClasses, type TabsPart } from '@fibrae/semi-foundation/components/tabs/constants';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-vue';
    import { SlotFragment } from '../../base/index';
    import { slotNodes, hasSlotContent } from '../../utils/index';
    import Button from '../button';
    import Dropdown, { DropdownItem, DropdownMenu } from '../dropdown';
    import useLocale from '../locale/use-locale';
    import type { TabsDropdownItemProps } from './interface';
    import type { BarItem } from './read-panes';

    const props = defineProps<{
        items: BarItem[];
        position: 'start' | 'end';
        showRestInDropdown: boolean;
        dropdownProps?: TabsDropdownItemProps;
        classNames?: Partial<Record<TabsPart, ClassValue>>;
        styles?: Partial<Record<TabsPart, StyleValue>>;
    }>();

    const emit = defineEmits<{
        arrowClick: [];
        tabClick: [itemKey: string, event: MouseEvent];
    }>();

    const locale = useLocale('Tabs');

    const prefix = cssClasses.TABS_BAR;
</script>

<template>
    <div v-if="!props.items.length" :class="[`${prefix}-arrow-${props.position}`, `${prefix}-arrow`, props.classNames?.arrow]" role="presentation" :style="props.styles?.arrow">
        <Button :aria-label="props.position === 'start' ? locale.locale.prevTabs : locale.locale.nextTabs" disabled theme="borderless">
            <template #icon>
                <IconChevronLeft v-if="props.position === 'start'" />
                <IconChevronRight v-else />
            </template>
        </Button>
    </div>
    <component
        :is="props.showRestInDropdown ? Dropdown : SlotFragment"
        v-else
        :class="[`${prefix}-dropdown`, props.classNames?.dropdown]"
        clickToHide
        clickTriggerToHide
        disableFocusListener
        :position="props.position === 'start' ? 'bottomLeft' : 'bottomRight'"
        showTick
        :style="props.styles?.dropdown"
        trigger="hover"
        v-bind="props.dropdownProps"
    >
        <!-- the Button is the Tab stop; Dropdown would add tabindex 0 here -->
        <div :class="[`${prefix}-arrow-${props.position}`, `${prefix}-arrow`, props.classNames?.arrow]" role="presentation" :style="props.styles?.arrow" tabindex="-1" @click="emit('arrowClick')">
            <Button :aria-label="props.position === 'start' ? locale.locale.prevTabs : locale.locale.nextTabs" theme="borderless">
                <template #icon>
                    <IconChevronLeft v-if="props.position === 'start'" />
                    <IconChevronRight v-else />
                </template>
            </Button>
        </div>
        <template #content>
            <DropdownMenu>
                <DropdownItem v-for="item in props.items" :key="item.itemKey" :active="item.active" :disabled="item.disabled" @click="emit('tabClick', item.itemKey, $event)">
                    <span v-if="hasSlotContent(item.iconSlot)">
                        <component :is="node" v-for="[node, key] in slotNodes(item.iconSlot?.() ?? [])" :key="key" />
                    </span>
                    <template v-if="item.tabSlot">
                        <component :is="node" v-for="[node, key] in slotNodes(item.tabSlot())" :key="key" />
                    </template>
                    <template v-else>{{ item.tab }}</template>
                </DropdownItem>
            </DropdownMenu>
        </template>
    </component>
</template>
