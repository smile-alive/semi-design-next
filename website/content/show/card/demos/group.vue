<script setup lang="ts">
    import { ref } from 'vue';
    import { Card, CardGroup, Slider, Typography } from '@fibrae/semi-ui-vue';

    const spacing = ref(12);

    const onSpacingChange = (value: number | number[]) => {
        if (typeof value === 'number') spacing.value = value;
    };
</script>

<template>
    <Typography.Text id="card-group-spacing">滑动调节 Card 间距</Typography.Text>
    <Slider aria-labelledby="card-group-spacing" :defaultValue="12" :max="40" :min="10" :style="{ width: '360px' }" @change="onSpacingChange" />
    <br />
    <CardGroup :spacing="spacing">
        <Card v-for="idx in 8" :key="idx" :headerLine="false" shadows="hover" :style="{ width: '260px' }" title="Card title">
            <template #headerExtraContent>
                <Typography.Text link>More</Typography.Text>
            </template>
            <Typography.Text>Card content</Typography.Text>
        </Card>
    </CardGroup>
</template>
