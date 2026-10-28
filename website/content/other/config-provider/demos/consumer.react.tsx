import { ConfigProvider, ConfigConsumer, Typography } from '@fibrae/semi-ui-react';

export default function ConfigProviderDemo() {
    return (
        <ConfigProvider timeZone="GMT+08:00">
            {/*...*/}
            <ConfigConsumer>
                {(value) => {
                    return (
                        <Typography.Text ellipsis={{ showTooltip: { opts: { style: { minWidth: '1200px' } } } }} style={{ width: 600 }}>
                            {JSON.stringify(value)}
                        </Typography.Text>
                    );
                }}
            </ConfigConsumer>
            {/*...*/}
        </ConfigProvider>
    );
}
