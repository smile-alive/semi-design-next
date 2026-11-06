<script setup lang="ts">
    import { Card, CardGroup, Typography } from '@fibrae/semi-ui-vue';
</script>

<template>
    <CardGroup type="grid">
        <Card v-for="idx in 7" :key="idx" :headerLine="false" shadows="hover" :style="{ width: '260px' }" title="Card title">
            <template #headerExtraContent>
                <Typography.Text link>More</Typography.Text>
            </template>
            <Typography.Text>Card content</Typography.Text>
        </Card>
    </CardGroup>
</template>
