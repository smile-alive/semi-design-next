<script setup lang="ts">
    import { Card, CardGroup, TypographyText } from '@fibrae/semi-ui-vue';
</script>

<template>
    <CardGroup type="grid">
        <Card v-for="idx in 7" :key="idx" :headerLine="false" shadows="hover" :style="{ width: '260px' }" title="Card title">
            <template #headerExtraContent>
                <TypographyText link>More</TypographyText>
            </template>
            <TypographyText>Card content</TypographyText>
        </Card>
    </CardGroup>
</template>
