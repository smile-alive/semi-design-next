<script setup lang="ts">
    import { LocaleProvider, Pagination } from '@fibrae/semi-ui-vue';
    import { en_US, zh_CN } from '@fibrae/semi-ui-vue/locale';
</script>

<template>
    <LocaleProvider :locale="en_US">
        <Pagination showSizeChanger showTotal :style="{ margin: '20px' }" :total="100" />
    </LocaleProvider>
    <LocaleProvider :locale="zh_CN">
        <Pagination showSizeChanger showTotal :style="{ margin: '20px' }" :total="100" />
    </LocaleProvider>
</template>
