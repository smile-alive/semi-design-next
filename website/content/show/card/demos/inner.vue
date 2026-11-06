<script setup lang="ts">
    import { Card, Typography } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Card title="Card title">
        <Card :style="{ marginBottom: '20px' }" title="Inner Card title">
            <template #headerExtraContent>
                <Typography.Text link>More</Typography.Text>
            </template>
            Inner Card content
        </Card>
        <Card title="Inner Card title">
            <template #headerExtraContent>
                <Typography.Text link>More</Typography.Text>
            </template>
            Inner Card content
        </Card>
    </Card>
</template>
