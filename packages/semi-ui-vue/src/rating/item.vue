<script setup lang="ts">
    import { computed, useAttrs, useTemplateRef } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/rating/constants';
    import RatingFoundation from '@fibrae/semi-foundation/rating/foundation';
    import { IconStar } from '@fibrae/semi-icons-vue';
    import useLocale from '../locale/use-locale';
    import type { RatingItemHandle } from './interface';

    // A wrapping Tooltip injects a Tab stop and its listeners: the radios keep the roving tabindex, and only the
    // description reaches them.
    defineOptions({ inheritAttrs: false });

    const props = withDefaults(
        defineProps<{
            /** The committed value: decides aria-checked and the roving Tab stop */
            value: number;
            /** The value the star fill shows: the hovered value while hovering, else `value` */
            displayValue: number;
            index: number;
            prefixCls: string;
            allowHalf: boolean;
            disabled: boolean;
            count: number;
            size: number | 'small' | 'default';
            /** A custom unit used as is; otherwise the locale names it */
            unit?: string;
            preventScroll?: boolean;
            /** No radio stands for the value: this star's first radio is the Tab stop */
            firstTabStop?: boolean;
        }>(),
        { unit: undefined, preventScroll: undefined, firstTabStop: false }
    );

    const emit = defineEmits<{
        /** The pointer moved over the star: a preview of its value */
        preview: [event: MouseEvent];
        pick: [event: MouseEvent];
        /** Enter or Space on a radio, or a click without a pointer (assistive technology): the value that radio stands for */
        select: [event: KeyboardEvent | MouseEvent, value: number];
        radioFocus: [event: FocusEvent];
    }>();

    defineSlots<{ character?: () => unknown }>();
    const attrs = useAttrs();

    const locale = useLocale('Rating');

    const li = useTemplateRef('li');
    const first = useTemplateRef('first');
    const second = useTemplateRef('second');

    const isEmpty = computed(() => props.index === props.count);
    const isCustomSize = computed(() => typeof props.size === 'number');
    const model = computed(() => RatingFoundation.getItemModel(props));

    const starClass = computed(() => [
        props.prefixCls,
        {
            [`${props.prefixCls}-half`]: model.value.isHalf,
            [`${props.prefixCls}-full`]: model.value.isFull,
            [`${props.prefixCls}-${props.size}`]: !isCustomSize.value,
        },
    ]);

    const sizeStyle = computed(() => {
        const size = `${props.size}px`;
        return isCustomSize.value ? { width: size, height: size, fontSize: size } : undefined;
    });

    const iconSize = computed(() => (isCustomSize.value ? 'inherit' : props.size === 'small' ? 'default' : 'extra-large'));

    // a function replacer keeps `$&` and `$$` in a custom unit literal
    const itemName = (n: number) => locale.value.locale.itemLabel.replace('${value}', String(n)).replace('${unit}', () => props.unit ?? (n === 1 ? locale.value.locale.star : locale.value.locale.stars));

    const describedby = () => attrs['aria-describedby'] as string | undefined;

    // a disabled radio can still take focus by a click, but it reports nothing
    const onFocus = (event: FocusEvent) => {
        if (!props.disabled) {
            emit('radioFocus', event);
        }
    };

    const radioValueOf = (target: EventTarget | null) => (target === first.value ? model.value.firstValue : target === second.value ? model.value.secondValue : undefined);

    const onClick = (event: MouseEvent) => {
        if (props.disabled) {
            return;
        }
        const radioValue = RatingFoundation.resolveClickRadio(event.detail, radioValueOf(event.target));
        if (radioValue === undefined) {
            emit('pick', event);
        } else {
            emit('select', event, radioValue);
        }
    };

    const onMousemove = (event: MouseEvent) => {
        if (!props.disabled) {
            emit('preview', event);
        }
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (props.disabled) {
            return;
        }
        const { preventDefault, selectValue } = RatingFoundation.resolveKeyActivation(event.key, radioValueOf(event.target), props.value);
        if (preventDefault) {
            event.preventDefault();
        }
        if (selectValue !== undefined) {
            emit('select', event, selectValue);
        }
    };

    defineExpose<RatingItemHandle>({
        starFocus: (starValue) => {
            const star = RatingFoundation.isFirstRadio(starValue, props.index, props.allowHalf) ? first.value : second.value;
            star?.focus({ preventScroll: props.preventScroll });
        },
        getDomNode: () => li.value,
    });
</script>

<template>
    <li ref="li" :class="starClass" role="none" :style="sizeStyle">
        <div :class="[`${props.prefixCls}-wrapper`, { [`${props.prefixCls}-disabled`]: props.disabled }]" role="presentation" @click="onClick" @keydown="onKeydown" @mousemove="onMousemove">
            <div
                v-if="props.allowHalf && !isEmpty"
                ref="first"
                :aria-checked="props.value === model.firstValue"
                :aria-describedby="describedby()"
                :aria-disabled="props.disabled"
                :aria-label="itemName(model.firstValue)"
                :aria-posinset="2 * props.index + 1"
                :aria-setsize="model.setSize"
                :class="[`${props.prefixCls}-first`, `${cssClasses.PREFIX}-no-focus`]"
                role="radio"
                :style="{ width: model.firstWidth }"
                :tabindex="model.firstTabIndex"
                @focus="onFocus"
            >
                <slot name="character">
                    <IconStar :size="iconSize" :style="{ display: 'block' }" />
                </slot>
            </div>
            <div
                ref="second"
                :aria-checked="props.value === model.secondValue"
                :aria-describedby="describedby()"
                :aria-disabled="props.disabled"
                :aria-label="itemName(model.secondValue)"
                :aria-posinset="model.secondPosInSet"
                :aria-setsize="model.setSize"
                :class="[`${props.prefixCls}-second`, `${cssClasses.PREFIX}-no-focus`]"
                role="radio"
                :tabindex="model.secondTabIndex"
                x-semi-prop="character"
                @focus="onFocus"
            >
                <slot name="character">
                    <IconStar :size="iconSize" :style="{ display: 'block' }" />
                </slot>
            </div>
        </div>
    </li>
</template>
