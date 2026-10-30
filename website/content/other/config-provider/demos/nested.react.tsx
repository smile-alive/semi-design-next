import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { ConfigProvider, ConfigConsumer } from '@fibrae/semi-ui-react';

function Show({ title }: { title: string }) {
    return (
        <ConfigConsumer>
            {({ locale, timeZone, direction }) => (
                <div style={{ margin: 8 }}>
                    {title}：locale = {locale?.code ?? '未设置'}，timeZone = {String(timeZone)}，direction = {direction}
                </div>
            )}
        </ConfigConsumer>
    );
}

export default function ConfigProviderDemo() {
    return (
        <ConfigProvider locale={en_US} timeZone="Asia/Tokyo" direction="ltr">
            <Show title="外层" />
            <ConfigProvider timeZone={8}>
                <Show title="内层只传 timeZone，其余继承外层" />
            </ConfigProvider>
        </ConfigProvider>
    );
}
