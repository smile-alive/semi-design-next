import { LocaleProvider, Pagination } from '@fibrae/semi-ui-solid';
import { en_US, zh_CN } from '@fibrae/semi-ui-solid/locale';

export default function LocaleDemo() {
    return (
        <>
            <LocaleProvider locale={en_US}>
                <Pagination total={100} showTotal showSizeChanger style={{ margin: '20px' }} />
            </LocaleProvider>
            <LocaleProvider locale={zh_CN}>
                <Pagination total={100} showTotal showSizeChanger style={{ margin: '20px' }} />
            </LocaleProvider>
        </>
    );
}
