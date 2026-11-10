<script setup lang="ts">
    import { ref } from 'vue';
    import { InputNumber, LocaleProvider, Select } from '@fibrae/semi-ui-vue';
    import { en_US, zh_CN, type LocaleInput } from '@fibrae/semi-ui-vue/locale';

    const language: Record<string, LocaleInput> = {
        zh_CN,
        en_US,
        en_GB: { code: 'en-GB', currency: 'GBP' },
        ja_JP: { code: 'ja-JP', currency: 'JPY' },
        ko_KR: { code: 'ko-KR', currency: 'KRW' },
        de: { code: 'de', currency: 'EUR' },
        pt_BR: { code: 'pt-BR', currency: 'BRL' },
    };

    const localeCode = ref('zh_CN');
</script>

<template>
    <div style="padding-bottom: 20px">
        <Select aria-label="切换语言" style="width: 250px" :value="localeCode" @change="(value) => (localeCode = String(value))">
            <template #insetLabel>切换语言</template>
            <Select.Option value="zh_CN">简体中文</Select.Option>
            <Select.Option value="en_US">英语（美）</Select.Option>
            <Select.Option value="en_GB">英语（英）</Select.Option>
            <Select.Option value="ja_JP">日语</Select.Option>
            <Select.Option value="ko_KR">韩语</Select.Option>
            <Select.Option value="de">德语</Select.Option>
            <Select.Option value="pt_BR">葡萄牙语（巴西）</Select.Option>
        </Select>
    </div>
    <LocaleProvider :locale="language[localeCode]">
        <InputNumber :key="localeCode" aria-label="金额" currency :defaultValue="123456.78" />
    </LocaleProvider>
</template>
