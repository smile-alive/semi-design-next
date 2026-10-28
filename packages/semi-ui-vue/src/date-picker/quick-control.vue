<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses } from '@fibrae/semi-foundation/date-picker/constants';
    import type { PresetType } from '@fibrae/semi-foundation/date-picker/foundation';
    import Button from '../button/button.vue';
    import Text from '../typography/text.vue';
    import type { DatePickerQuickControlEmits, DatePickerQuickControlProps } from './internal';

    const props = withDefaults(defineProps<DatePickerQuickControlProps>(), {
        presets: () => [],
        presetPosition: 'bottom',
        insetInput: false,
    });

    const emit = defineEmits<DatePickerQuickControlEmits>();

    const prefix = cssClasses.PREFIX;
    const base = computed(() => `${prefix}-quick-control-${props.presetPosition}`);
    const isPanelTopAndBottom = computed(() => props.presetPosition === 'top' || props.presetPosition === 'bottom');
    const items = computed<PresetType[]>(() => props.presets.map((item) => (typeof item === 'function' ? item() : item)));

    const partClass = (suffix: string) => {
        const range = isPanelTopAndBottom.value && (props.type === 'dateRange' || props.type === 'dateTimeRange');
        const month = isPanelTopAndBottom.value && (props.type === 'month' || props.type === 'year');
        return {
            [`${base.value}-content${suffix}`]: !range && !month,
            [`${base.value}-range-content${suffix}`]: range,
            [`${base.value}-month-content${suffix}`]: month,
        };
    };
</script>

<template>
    <div v-if="items.length" :class="[`${prefix}-quick-control`, base, { [`${prefix}-quick-control-${props.type}`]: props.type }]" :x-insetinput="props.insetInput ? 'true' : 'false'">
        <div v-if="!isPanelTopAndBottom" :class="`${prefix}-quick-control-header`">{{ props.locale.presets }}</div>
        <div :class="`${base}-content-wrapper`">
            <div :class="partClass('')">
                <Button v-for="(preset, index) in items" :key="index" size="small" type="primary" @click="emit('presetClick', preset, $event)">
                    <!-- a button takes phrasing content only -->
                    <span :class="partClass('-item')">
                        <Text :class="partClass('-item-ellipsis')" :ellipsis="{ showTooltip: true }">
                            {{ preset.text }}
                        </Text>
                    </span>
                </Button>
            </div>
        </div>
    </div>
</template>
