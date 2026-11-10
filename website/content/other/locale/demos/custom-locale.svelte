<script lang="ts">
    import { ja } from 'date-fns/locale/ja';
    import { ConfigProvider, DatePicker, Pagination } from '@fibrae/semi-ui-svelte';
    import type { LocaleInput } from '@fibrae/semi-ui-svelte/locale';

    const ja_JP: LocaleInput = {
        code: 'ja-JP',
        currency: 'JPY',
        Pagination: { prev: '前へ', next: '次へ', jumpTo: 'ページへ', page: 'ページ' },
        DatePicker: { placeholder: { date: '日付を選択してください' } },
    };
</script>

<ConfigProvider dateFnsLocale={ja} locale={ja_JP}>
    <Pagination showQuickJumper showSizeChanger showTotal style="margin: 20px" total={100} />
    <DatePicker style="margin: 20px; width: 250px" />
</ConfigProvider>
