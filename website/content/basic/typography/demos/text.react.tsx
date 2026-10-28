import { Typography } from '@fibrae/semi-ui-react';

export default function TypographyDemo() {
    const { Text } = Typography;
    return (
        <div>
            <Text>Text</Text>
            <br />
            <br />
            <Text type="secondary">Secondary</Text>
            <br />
            <br />
            <Text type="tertiary">{`Tertiary v>=1.2.0`}</Text>
            <br />
            <br />
            <Text type="quaternary">{`Quaternary v>=1.2.0`}</Text>
            <br />
            <br />
            <Text type="warning">Warning</Text>
            <br />
            <br />
            <Text type="danger">Danger</Text>
            <br />
            <br />
            <Text type="success">{`Success v>=1.7.0`}</Text>
            <br />
            <br />
            <Text disabled>Disabled</Text>
            <br />
            <br />
            <Text mark>Default Mark</Text>
            <br />
            <br />
            <Text code>Example Code</Text>
            <br />
            <br />
            <Text underline>Underline</Text>
            <br />
            <br />
            <Text delete>Deleted</Text>
            <br />
            <br />
            <Text strong>Strong</Text>
        </div>
    );
}
