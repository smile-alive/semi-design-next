<script setup lang="ts">
    import ScrollList, { ScrollItem, type ScrollItemSelectData } from '../..';
    import Button from '../../../button';

    const props = withDefaults(
        defineProps<{
            mode?: 'normal' | 'wheel';
            motion?: boolean;
            selectedAmpmIndex?: number;
            selectedHourIndex?: number;
            selectedMinuteIndex?: number;
        }>(),
        { mode: 'wheel', motion: true, selectedAmpmIndex: 1, selectedHourIndex: 1, selectedMinuteIndex: 1 }
    );
    const emit = defineEmits<{
        ampmSelect: [data: ScrollItemSelectData];
        hourSelect: [data: ScrollItemSelectData];
        minuteSelect: [data: ScrollItemSelectData];
    }>();

    const ampms = [
        { value: 'AM', transform: () => '上午' },
        { value: 'PM', transform: () => '下午' },
    ];
    const hours = Array.from({ length: 12 }, (_, index) => ({ value: index + 1 }));
    const minutes = Array.from({ length: 60 }, (_, index) => ({ value: index, disabled: index % 2 === 1 }));
</script>

<template>
    <ScrollList>
        <template #header>滚动列表</template>
        <ScrollItem :cycled="false" :list="ampms" :mode="props.mode" :motion="props.motion" :selectedIndex="props.selectedAmpmIndex" :type="1" @select="emit('ampmSelect', $event)" />
        <ScrollItem :cycled="false" :list="hours" :mode="props.mode" :motion="props.motion" :selectedIndex="props.selectedHourIndex" :type="2" @select="emit('hourSelect', $event)" />
        <ScrollItem :cycled="false" :list="minutes" :mode="props.mode" :motion="props.motion" :selectedIndex="props.selectedMinuteIndex" :type="3" @select="emit('minuteSelect', $event)" />
        <template #footer>
            <Button size="small" type="primary">Ok</Button>
        </template>
    </ScrollList>
</template>
