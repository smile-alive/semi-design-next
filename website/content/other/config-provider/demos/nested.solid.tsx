import en_US from '@fibrae/semi-foundation/locale/source/en_US';
import { ConfigProvider, ConfigConsumer } from '@fibrae/semi-ui-solid';

function ConfigSummary(props: { title: string }) {
    return (
        <ConfigConsumer>
            {(config) => (
                <div style={{ margin: '8px' }}>
                    {props.title}：locale = {config.locale?.code ?? '未设置'}，timeZone = {String(config.timeZone)}，direction = {config.direction}
                </div>
            )}
        </ConfigConsumer>
    );
}

export default function ConfigProviderDemo() {
    return (
        <ConfigProvider locale={en_US} timeZone="Asia/Tokyo" direction="ltr">
            <ConfigSummary title="外层" />
            <ConfigProvider timeZone={8}>
                <ConfigSummary title="内层只传 timeZone，其余继承外层" />
            </ConfigProvider>
        </ConfigProvider>
    );
}
