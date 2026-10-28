<script setup lang="ts">
    import { computed } from 'vue';
    import { cssClasses, strings } from '@fibrae/semi-foundation/progress/constants';
    import { generateColor } from '@fibrae/semi-foundation/progress/generates';
    import { calcCircleGeometry, calcPercent } from '@fibrae/semi-foundation/progress/utils';
    import '@fibrae/semi-foundation/progress/progress.scss';
    import type { ElementProps } from '../_base/element-props';
    import semiDefault, { semiGlobalDefault } from '../_base/semi-default';
    import type { ProgressProps, ProgressSlots } from './interface';
    import { useAnimatedPercent } from './use-progress';

    const props = withDefaults(defineProps<ProgressProps & /* @vue-ignore */ ElementProps<'div', keyof ProgressProps>>(), {
        direction: () => semiDefault('Progress', 'direction', 'horizontal'),
        indeterminate: () => semiDefault('Progress', 'indeterminate', false),
        motion: () => semiDefault('Progress', 'motion', true),
        orbitStroke: semiGlobalDefault('Progress', 'orbitStroke'),
        percent: () => semiDefault('Progress', 'percent', 0),
        showInfo: () => semiDefault('Progress', 'showInfo', false),
        size: () => semiDefault('Progress', 'size', 'default'),
        stroke: semiGlobalDefault('Progress', 'stroke'),
        strokeGradient: () => semiDefault('Progress', 'strokeGradient', false),
        strokeLinecap: () => semiDefault('Progress', 'strokeLinecap', 'round'),
        strokeWidth: () => semiDefault('Progress', 'strokeWidth', 4),
        type: () => semiDefault('Progress', 'type', 'line'),
        width: semiGlobalDefault('Progress', 'width'),
    });

    defineSlots<ProgressSlots>();

    const shown = useAnimatedPercent(
        () => props.percent,
        () => props.motion
    );

    const prefixCls = cssClasses.PREFIX;

    // aria-valuenow and the fill use the target; only the text animates
    const perc = computed(() => calcPercent(props.percent));
    const percNumber = computed(() => calcPercent(shown.value));
    const strokeColor = computed(() => (Array.isArray(props.stroke) ? generateColor(props.stroke, perc.value, props.strokeGradient) : props.stroke));
    const horizontal = computed(() => props.direction === strings.DEFAULT_DIRECTION);

    // The indeterminate block is moved by a CSS animation, so no width or height is written and percent is ignored.
    const innerStyle = computed(() => {
        if (props.indeterminate) return { background: strokeColor.value };
        const extent = `${perc.value}%`;
        return horizontal.value ? { background: strokeColor.value, width: extent } : { background: strokeColor.value, height: extent };
    });

    const diameter = computed(() => props.width || (props.size === 'small' ? 24 : 72));
    const geometry = computed(() => calcCircleGeometry(diameter.value, props.strokeWidth, perc.value, props.indeterminate));
</script>

<template>
    <div
        v-if="props.type === 'line'"
        aria-valuemax="100"
        aria-valuemin="0"
        :aria-valuenow="props.indeterminate ? undefined : perc"
        :class="[
            prefixCls,
            horizontal ? `${prefixCls}-horizontal` : `${prefixCls}-vertical`,
            {
                [`${prefixCls}-large`]: props.size === 'large',
                [`${prefixCls}-indeterminate`]: props.indeterminate,
            },
        ]"
        role="progressbar"
    >
        <div aria-hidden="true" :class="`${prefixCls}-track`" :style="props.orbitStroke ? { backgroundColor: props.orbitStroke } : undefined">
            <div aria-hidden="true" :class="[`${prefixCls}-track-inner`, { [`${prefixCls}-track-inner-indeterminate`]: props.indeterminate }]" :style="innerStyle" />
        </div>
        <div v-if="props.showInfo && !props.indeterminate" :class="`${prefixCls}-line-text`">
            <slot name="format" :percent="percNumber">{{ percNumber }}%</slot>
        </div>
    </div>
    <div v-else aria-valuemax="100" aria-valuemin="0" :aria-valuenow="props.indeterminate ? undefined : perc" :class="`${prefixCls}-circle`" role="progressbar">
        <svg :key="props.size" aria-hidden="true" :class="`${prefixCls}-circle-ring`" :height="diameter" :width="diameter">
            <circle
                aria-hidden="true"
                :class="`${prefixCls}-circle-ring-track`"
                :cx="geometry.center"
                :cy="geometry.center"
                fill="transparent"
                :r="geometry.radius"
                :stroke-dasharray="`${geometry.circumference} ${geometry.circumference}`"
                stroke-dashoffset="0"
                :stroke-linecap="props.strokeLinecap"
                :stroke-width="props.strokeWidth"
                :style="{ stroke: props.orbitStroke }"
            />
            <circle
                aria-hidden="true"
                :class="[`${prefixCls}-circle-ring-inner`, { [`${prefixCls}-circle-ring-inner-indeterminate`]: props.indeterminate }]"
                :cx="geometry.center"
                :cy="geometry.center"
                fill="transparent"
                :r="geometry.radius"
                :stroke-dasharray="geometry.strokeDasharray"
                :stroke-dashoffset="geometry.strokeDashoffset"
                :stroke-linecap="props.strokeLinecap"
                :stroke-width="props.strokeWidth"
                :style="{ stroke: strokeColor }"
            />
        </svg>
        <span v-if="props.showInfo && props.size !== 'small' && !props.indeterminate" :class="`${prefixCls}-circle-text`">
            <slot name="format" :percent="percNumber">{{ percNumber }}%</slot>
        </span>
    </div>
</template>
