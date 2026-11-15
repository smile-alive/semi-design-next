<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/form/constants';
    import { singleItemName } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import { IconArrowDown, IconArrowUp, IconDelete, IconPlus } from '@fibrae/semi-icons-vue';
    import Button from '../../button';
    import useLocale from '../../locale/use-locale';
    import type { SchemaArrayContext } from '../interface';
    import SemiSection from './semi-section.vue';

    const props = defineProps<{ context: SchemaArrayContext }>();

    const locale = useLocale('Form');

    const rowClass = `${cssClasses.PREFIX}-schema-array-row`;

    const withIndex = (text: string, index: number) => formatLocale(text, { index: index + 1 });
</script>

<template>
    <SemiSection :node="props.context.node" v-bind="props.context.fieldProps">
        <div v-for="item in props.context.items" :key="item.key" :class="[rowClass, singleItemName(item.node, locale.locale) !== undefined && `${rowClass}-single`]">
            <div :class="`${rowClass}-content`">
                <component :is="props.context.render(item.field)" />
            </div>
            <div :class="`${rowClass}-actions`">
                <Button :aria-label="withIndex(locale.locale.moveUpItem, item.index)" :disabled="item.index === 0" theme="borderless" type="tertiary" @click="props.context.move(item.index, item.index - 1)">
                    <template #icon>
                        <IconArrowUp />
                    </template>
                </Button>
                <Button :aria-label="withIndex(locale.locale.moveDownItem, item.index)" :disabled="item.index === props.context.count - 1" theme="borderless" type="tertiary" @click="props.context.move(item.index, item.index + 1)">
                    <template #icon>
                        <IconArrowDown />
                    </template>
                </Button>
                <Button v-if="!props.context.fixed" :aria-label="withIndex(locale.locale.removeItem, item.index)" :disabled="!props.context.canRemove" theme="borderless" type="tertiary" @click="item.remove()">
                    <template #icon>
                        <IconDelete />
                    </template>
                </Button>
            </div>
        </div>
        <Button v-if="!props.context.fixed" :disabled="!props.context.canAdd" @click="props.context.add()">
            <template #icon>
                <IconPlus />
            </template>
            {{ locale.locale.addItem }}
        </Button>
    </SemiSection>
</template>
