<script lang="ts">
    import { InputNumber, LocaleProvider, Select } from '@fibrae/semi-ui-svelte';
    import { en_US, zh_CN, type LocaleInput } from '@fibrae/semi-ui-svelte/locale';

    const language: Record<string, LocaleInput> = {
        zh_CN,
        en_US,
        en_GB: { code: 'en-GB', currency: 'GBP' },
        ja_JP: { code: 'ja-JP', currency: 'JPY' },
        ko_KR: { code: 'ko-KR', currency: 'KRW' },
        de: { code: 'de', currency: 'EUR' },
        pt_BR: { code: 'pt-BR', currency: 'BRL' },
    };

    const optionList = [
        { value: 'zh_CN', label: '简体中文' },
        { value: 'en_US', label: '英语（美）' },
        { value: 'en_GB', label: '英语（英）' },
        { value: 'ja_JP', label: '日语' },
        { value: 'ko_KR', label: '韩语' },
        { value: 'de', label: '德语' },
        { value: 'pt_BR', label: '葡萄牙语（巴西）' },
    ];

    let localeCode = $state('zh_CN');
</script>

<div style="padding-bottom: 20px">
    <Select aria-label="切换语言" onChange={(value) => (localeCode = String(value))} {optionList} style="width: 250px" value={localeCode}>
        {#snippet insetLabel()}切换语言{/snippet}
    </Select>
</div>
<LocaleProvider locale={language[localeCode]}>
    {#key localeCode}
        <InputNumber aria-label="金额" currency value={123456.78} />
    {/key}
</LocaleProvider>
