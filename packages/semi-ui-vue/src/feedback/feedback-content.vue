<script setup lang="ts">
    import { computed, useId } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/feedback/constants';
    import type { EmojiResult } from '@fibrae/semi-foundation/feedback/foundation';
    import CheckboxGroup from '../checkbox/checkbox-group.vue';
    import TextArea from '../input/textarea.vue';
    import useLocale from '../locale/use-locale';
    import type { RadioValue } from '../radio/interface';
    import RadioGroup from '../radio/radio-group.vue';
    import type { FeedbackContentEmits, FeedbackContentProps, FeedbackContentSlots } from './interface';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<FeedbackContentProps>();
    const emit = defineEmits<FeedbackContentEmits>();
    defineSlots<FeedbackContentSlots>();

    const locale = useLocale('Feedback');

    const emojiGroupName = useId();

    const prefix = cssClasses.PREFIX;
    const { Emoji } = strings;

    // The listeners of the control props are called by the foundation, so they must not replace the built-in ones.
    // `modelValue` is bound after `v-bind` so a stray one cannot desync the control from the reported value.
    const textAreaRest = computed(() => {
        const { onChange: _onChange, ...rest } = props.textAreaProps ?? {};
        return rest;
    });

    const textAreaBound = computed(() => ({ placeholder: locale.value.locale.placeholder, ...textAreaRest.value, modelValue: typeof props.value === 'string' ? props.value : '' }));

    const radioRest = computed(() => {
        const { onChange: _onChange, ...rest } = props.radioGroupProps ?? {};
        return rest;
    });

    const checkboxRest = computed(() => {
        const { onChange: _onChange, ...rest } = props.checkboxGroupProps ?? {};
        return rest;
    });

    const emoji = computed(() => (props.type === 'emoji' ? (props.value as EmojiResult | null)?.emoji : undefined));

    // null (submitted or cancelled) clears the group selection; objects and arrays are no radio value.
    const radioValue = computed<RadioValue | undefined>(() => {
        const { value } = props;
        return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : undefined;
    });
</script>

<template>
    <TextArea v-if="props.type === 'text'" v-bind="textAreaBound" @change="(value, event) => emit('textChange', value, event)" />
    <template v-else-if="props.type === 'emoji'">
        <!-- APG radio group: native radios provide the arrow keys, single Tab stop and checked state -->
        <div :aria-label="locale.locale.rating" :class="`${prefix}-emoji-container`" role="radiogroup">
            <label v-for="(item, name) in Emoji" :key="item" :class="[`${prefix}-emoji-item`, { [`${prefix}-emoji-item-selected`]: item === emoji }]" :data-value="item">
                <input :aria-label="locale.locale[name]" :checked="item === emoji" :class="`${prefix}-emoji-input`" :name="emojiGroupName" type="radio" :value="item" @change="emit('emojiChange', item)" />
                <span aria-hidden="true" :class="`${prefix}-emoji-glyph`">{{ item }}</span>
            </label>
        </div>
        <TextArea v-if="emoji === Emoji.bad" :placeholder="locale.locale.placeholderOptional" v-bind="textAreaRest" @change="(value, event) => emit('reasonChange', value, event)" />
    </template>
    <div v-else-if="props.type === 'radio'" :class="`${prefix}-radio-container`">
        <RadioGroup direction="vertical" v-bind="radioRest" :modelValue="radioValue" @change="emit('radioChange', $event)">
            <template v-if="$slots.radioLabel" #label="slotProps">
                <slot name="radioLabel" v-bind="slotProps" />
            </template>
            <template v-if="$slots.radioExtra" #extra="slotProps">
                <slot name="radioExtra" v-bind="slotProps" />
            </template>
        </RadioGroup>
    </div>
    <div v-else-if="props.type === 'checkbox'" :class="`${prefix}-checkbox-container`">
        <CheckboxGroup direction="vertical" v-bind="checkboxRest" :modelValue="Array.isArray(props.value) ? props.value : []" @change="emit('checkboxChange', $event)">
            <template v-if="$slots.checkboxLabel" #label="slotProps">
                <slot name="checkboxLabel" v-bind="slotProps" />
            </template>
            <template v-if="$slots.checkboxExtra" #extra="slotProps">
                <slot name="checkboxExtra" v-bind="slotProps" />
            </template>
        </CheckboxGroup>
    </div>
    <slot v-else />
</template>
