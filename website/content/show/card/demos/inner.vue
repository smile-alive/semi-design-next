<script setup lang="ts">
    import { Card, TypographyText } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Card title="Card title">
        <Card :style="{ marginBottom: '20px' }" title="Inner Card title">
            <template #headerExtraContent>
                <TypographyText link>More</TypographyText>
            </template>
            Inner Card content
        </Card>
        <Card title="Inner Card title">
            <template #headerExtraContent>
                <TypographyText link>More</TypographyText>
            </template>
            Inner Card content
        </Card>
    </Card>
</template>
