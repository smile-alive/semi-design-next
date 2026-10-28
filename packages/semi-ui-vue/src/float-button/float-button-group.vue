<script setup lang="ts">
    import { cssClasses, cssClassesGroup } from '@fibrae/semi-foundation/float-button/constants';
    import '@fibrae/semi-foundation/float-button/float-button.scss';
    import type { ElementProps, EmitHandlers } from '../_base/element-props';
    import semiDefault from '../_base/semi-default';
    import Badge from '../badge';
    import FloatButtonAction from './float-button-action.vue';
    import type { FloatButtonGroupEmits, FloatButtonGroupItem, FloatButtonGroupProps, FloatButtonGroupSlots } from './interface';

    const props = withDefaults(defineProps<FloatButtonGroupProps & /* @vue-ignore */ ElementProps<'div', keyof FloatButtonGroupProps | EmitHandlers<FloatButtonGroupEmits>>>(), {
        disabled: () => semiDefault('FloatButtonGroup', 'disabled', false),
    });

    // Declared so that only a click on an item reports; a listener left to attrs would also fire for the group's padding.
    const emit = defineEmits<FloatButtonGroupEmits>();
    defineSlots<FloatButtonGroupSlots>();

    const prefix = cssClassesGroup.PREFIX;
    const buttonPrefix = cssClasses.PREFIX;

    const actionProps = (item: FloatButtonGroupItem) => {
        const { badge: _badge, colorful, content: _content, disabled, shape, size, value, ...rest } = item;
        const itemDisabled = props.disabled || disabled;
        return {
            ...rest,
            class: [
                `${prefix}-item`,
                item.class,
                {
                    [`${buttonPrefix}-${shape}`]: shape,
                    [`${buttonPrefix}-${size}`]: size,
                    [`${buttonPrefix}-colorful`]: colorful,
                    [`${prefix}-item-disabled`]: itemDisabled,
                },
            ],
            'data-value': value,
            disabled: itemDisabled,
            onClick: (event: MouseEvent) => {
                item.onClick?.(event);
                emit('click', value, event);
            },
        };
    };
</script>

<template>
    <div :class="[prefix, { [`${prefix}-disabled`]: props.disabled }]" role="group">
        <template v-for="(item, index) in props.items" :key="index">
            <Badge v-if="item.badge" v-bind="item.badge">
                <template v-if="$slots.badgeCount" #count>
                    <slot :index="index" :item="item" name="badgeCount" />
                </template>
                <FloatButtonAction v-bind="actionProps(item)">
                    <slot :index="index" :item="item" name="icon" />
                    <slot :index="index" :item="item" name="content">{{ item.content }}</slot>
                </FloatButtonAction>
            </Badge>
            <FloatButtonAction v-else v-bind="actionProps(item)">
                <slot :index="index" :item="item" name="icon" />
                <slot :index="index" :item="item" name="content">{{ item.content }}</slot>
            </FloatButtonAction>
        </template>
    </div>
</template>
