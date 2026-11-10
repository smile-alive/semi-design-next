import { ja } from 'date-fns/locale/ja';
import { ConfigProvider, DatePicker, Pagination } from '@fibrae/semi-ui-solid';
import type { LocaleInput } from '@fibrae/semi-ui-solid/locale';

const ja_JP: LocaleInput = {
    code: 'ja-JP',
    currency: 'JPY',
    Pagination: { prev: '前へ', next: '次へ', jumpTo: 'ページへ', page: 'ページ' },
    DatePicker: { placeholder: { date: '日付を選択してください' } },
};

export default function CustomLocaleDemo() {
    return (
        <ConfigProvider locale={ja_JP} dateFnsLocale={ja}>
            <Pagination total={100} showTotal showSizeChanger showQuickJumper style={{ margin: '20px' }} />
            <DatePicker style={{ margin: '20px', width: '250px' }} />
        </ConfigProvider>
    );
}
