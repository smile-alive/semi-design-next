<script lang="ts">
    import ar from '@fibrae/semi-foundation/locale/source/ar';
    import de from '@fibrae/semi-foundation/locale/source/de';
    import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import es from '@fibrae/semi-foundation/locale/source/es';
    import fr from '@fibrae/semi-foundation/locale/source/fr';
    import id_ID from '@fibrae/semi-foundation/locale/source/id_ID';
    import it from '@fibrae/semi-foundation/locale/source/it';
    import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
    import ko_KR from '@fibrae/semi-foundation/locale/source/ko_KR';
    import ms_MY from '@fibrae/semi-foundation/locale/source/ms_MY';
    import nl_NL from '@fibrae/semi-foundation/locale/source/nl_NL';
    import pl_PL from '@fibrae/semi-foundation/locale/source/pl_PL';
    import pt_BR from '@fibrae/semi-foundation/locale/source/pt_BR';
    import ro from '@fibrae/semi-foundation/locale/source/ro';
    import ru_RU from '@fibrae/semi-foundation/locale/source/ru_RU';
    import sv_SE from '@fibrae/semi-foundation/locale/source/sv_SE';
    import th_TH from '@fibrae/semi-foundation/locale/source/th_TH';
    import tr_TR from '@fibrae/semi-foundation/locale/source/tr_TR';
    import vi_VN from '@fibrae/semi-foundation/locale/source/vi_VN';
    import zh_CN from '@fibrae/semi-foundation/locale/source/zh_CN';
    import zh_TW from '@fibrae/semi-foundation/locale/source/zh_TW';
    import { InputNumber, LocaleProvider, Select } from '@fibrae/semi-ui-svelte';

    const languages = {
        zh_CN,
        en_GB,
        en_US,
        ko_KR,
        ja_JP,
        ar,
        vi_VN,
        ru_RU,
        id_ID,
        ms_MY,
        th_TH,
        tr_TR,
        pt_BR,
        zh_TW,
        es,
        sv_SE,
        pl_PL,
        nl_NL,
        de,
        it,
        fr,
        ro,
    };

    const optionList = [
        { value: 'zh_CN', label: '简体中文' },
        { value: 'en_US', label: '英语（美）' },
        { value: 'en_GB', label: '英语（英）' },
        { value: 'ja_JP', label: '日语' },
        { value: 'ko_KR', label: '韩语' },
        { value: 'ar', label: '阿拉伯语' },
        { value: 'vi_VN', label: '越南语' },
        { value: 'ru_RU', label: '俄罗斯语' },
        { value: 'id_ID', label: '印尼语' },
        { value: 'ms_MY', label: '马来语' },
        { value: 'th_TH', label: '泰语' },
        { value: 'tr_TR', label: '土耳其语' },
        { value: 'pt_BR', label: '葡萄牙语（巴西）' },
        { value: 'zh_TW', label: '繁体中文' },
        { value: 'es', label: '西班牙语' },
        { value: 'de', label: '德语' },
        { value: 'it', label: '意大利语' },
        { value: 'fr', label: '法语' },
        { value: 'ro', label: '罗马尼亚语' },
        { value: 'sv_SE', label: '瑞典语' },
        { value: 'pl_PL', label: '波兰语' },
        { value: 'nl_NL', label: '荷兰语' },
    ];

    let localeCode = $state<keyof typeof languages>('zh_CN');
    const locale = $derived(languages[localeCode]);

    const onLanguageChange = (code: unknown) => {
        if (typeof code === 'string' && code in languages) {
            localeCode = code as keyof typeof languages;
        }
    };
</script>

<div style="padding-bottom: 20px">
    <Select aria-label="切换语言" onChange={onLanguageChange} {optionList} style="width: 250px" value="zh_CN">
        {#snippet insetLabel()}切换语言{/snippet}
    </Select>
</div>
<LocaleProvider {locale}>
    {#key localeCode}
        <InputNumber aria-label="金额" currency value={123456.78} />
    {/key}
</LocaleProvider>
