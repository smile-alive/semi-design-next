import { ConfigProvider, ConfigConsumer } from '@fibrae/semi-ui-react';
import { en_US } from '@fibrae/semi-ui-react/locale';

function Show({ title }: { title: string }) {
    return (
        <ConfigConsumer>
            {(config) => (
                <div style={{ margin: 8 }}>
                    {title}：locale = {config.locale?.code ?? '未设置'}，timeZone = {String(config.timeZone)}，direction = {config.direction}
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
