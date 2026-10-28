import en_GB from '@fibrae/semi-foundation/locale/source/en_GB';
import ja_JP from '@fibrae/semi-foundation/locale/source/ja_JP';
import { LocaleProvider, Pagination } from '@fibrae/semi-ui-solid';

export default function LocaleDemo() {
    return (
        <>
            <LocaleProvider locale={en_GB}>
                <Pagination total={100} showTotal showSizeChanger style={{ margin: '20px' }} />
            </LocaleProvider>
            <LocaleProvider locale={ja_JP}>
                <Pagination total={100} showTotal showSizeChanger style={{ margin: '20px' }} />
            </LocaleProvider>
        </>
    );
}
