<script setup lang="ts">
    import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
    import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
    import { LocaleProvider, Pagination } from '@fibrae/semi-ui-vue';
</script>

<template>
    <LocaleProvider :locale="en_GB">
        <Pagination showSizeChanger showTotal :style="{ margin: '20px' }" :total="100" />
    </LocaleProvider>
    <LocaleProvider :locale="ja_JP">
        <Pagination showSizeChanger showTotal :style="{ margin: '20px' }" :total="100" />
    </LocaleProvider>
</template>
