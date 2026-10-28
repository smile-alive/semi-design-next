import { ConfigProvider, ConfigConsumer, Typography } from '@fibrae/semi-ui-solid';

export default function ConfigProviderDemo() {
    return (
        <ConfigProvider timeZone="GMT+08:00">
            {/*...*/}
            <ConfigConsumer>
                {(value) => (
                    <Typography.Text ellipsis={{ showTooltip: { opts: { style: { 'min-width': '1200px' } } } }} style={{ width: '600px' }}>
                        {JSON.stringify(value)}
                    </Typography.Text>
                )}
            </ConfigConsumer>
            {/*...*/}
        </ConfigProvider>
    );
}
