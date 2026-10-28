<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { IconFullScreenStroked } from '@fibrae/semi-icons-vue';
    import type { ElementProps, EmitHandlers } from '@fibrae/semi-ui-vue/_base/element-props';
    import Button from '@fibrae/semi-ui-vue/button/index';
    import Collapse, { CollapsePanel } from '@fibrae/semi-ui-vue/collapse/index';
    import { useLocale } from '@fibrae/semi-ui-vue/hooks';
    import CodeItem from './code-item.vue';
    import CollapseHeader from './collapse-header.vue';
    import type { CodeContentEmits, CodeContentProps, CodeItemData, CodeItemSlots } from './interface';
    import { useHasExpandListener } from './use-expand-listener';

    const props = withDefaults(defineProps<CodeContentProps & /* @vue-ignore */ ElementProps<'div', keyof CodeContentProps | EmitHandlers<CodeContentEmits>>>(), { activeKey: undefined, codes: () => [] });
    const emit = defineEmits<CodeContentEmits>();
    defineSlots<CodeItemSlots>();

    const locale = useLocale('Sidebar');

    const hasExpandListener = useHasExpandListener();

    const collapseCls = cssClasses.COLLAPSE;

    const itemProps = ({ key: _key, ...item }: CodeItemData) => item;

    const onChange = (activeKey: string[]) => {
        emit('update:activeKey', activeKey);
        emit('change', activeKey);
    };
</script>

<template>
    <Collapse :activeKey="props.activeKey" :class="[collapseCls, `${collapseCls}-code`]" :clickHeaderToExpand="false" @change="onChange">
        <CollapsePanel v-for="code in props.codes" :key="code.key" :itemKey="code.key ?? ''">
            <template #header>
                <CollapseHeader mode="code" :name="code.name" />
            </template>
            <!-- the panel's extra sits beside the toggle button, not inside it -->
            <template v-if="hasExpandListener()" #extra>
                <Button :aria-label="locale.locale.expand" :class="`${collapseCls}-header-expand-btn`" theme="borderless" type="tertiary" @click="emit('expand', $event, code, 'code')">
                    <template #icon>
                        <IconFullScreenStroked />
                    </template>
                </Button>
            </template>
            <CodeItem v-bind="itemProps(code)">
                <template v-if="$slots.customRender" #customRender="slotProps">
                    <slot name="customRender" v-bind="slotProps" />
                </template>
                <template v-if="$slots.searchButton" #searchButton="slotProps">
                    <slot name="searchButton" v-bind="slotProps" />
                </template>
            </CodeItem>
        </CollapsePanel>
    </Collapse>
</template>
