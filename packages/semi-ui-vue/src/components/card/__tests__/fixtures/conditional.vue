<script setup lang="ts">
    import Card, { CardMeta } from '../..';

    const props = defineProps<{ show: boolean }>();
</script>

<template>
    <Card>
        <template #title>
            <span v-if="props.show">title</span>
        </template>
        <template #headerExtraContent>
            <span v-if="props.show">extra</span>
        </template>
        <template #cover>
            <img v-if="props.show" alt="cover" />
        </template>
        <template #footer>
            <span v-if="props.show">footer</span>
        </template>
        <template v-if="props.show" #actions>
            <span>action</span>
        </template>
        <span v-if="props.show">body</span>
        <CardMeta>
            <template #avatar>
                <span v-if="props.show">avatar</span>
            </template>
            <template #title>
                <span v-if="props.show">meta title</span>
            </template>
            <template #description>
                <span v-if="props.show">description</span>
            </template>
        </CardMeta>
    </Card>
</template>
