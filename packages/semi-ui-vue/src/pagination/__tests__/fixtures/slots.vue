<script setup lang="ts">
    import { IconChevronLeft } from '@fibrae/semi-icons-vue';
    import Pagination from '../..';
</script>

<template>
    <Pagination :total="200">
        <template #prevText>
            <IconChevronLeft />
        </template>
        <template #nextText>Later</template>
    </Pagination>
    <Pagination :total="200">
        <template #prevText>{{ undefined }}</template>
        <template #nextText>
            <template v-if="false">never</template>
        </template>
    </Pagination>
</template>
