import { Typography } from '@fibrae/semi-ui-solid';

export default function TypographyDemo() {
    return (
        <div>
            <Typography.Text>Text</Typography.Text>
            <br />
            <br />
            <Typography.Text type="secondary">Secondary</Typography.Text>
            <br />
            <br />
            <Typography.Text type="tertiary">Tertiary</Typography.Text>
            <br />
            <br />
            <Typography.Text type="quaternary">Quaternary</Typography.Text>
            <br />
            <br />
            <Typography.Text type="warning">Warning</Typography.Text>
            <br />
            <br />
            <Typography.Text type="danger">Danger</Typography.Text>
            <br />
            <br />
            <Typography.Text type="success">Success</Typography.Text>
            <br />
            <br />
            <Typography.Text disabled>Disabled</Typography.Text>
            <br />
            <br />
            <Typography.Text mark>Default Mark</Typography.Text>
            <br />
            <br />
            <Typography.Text code>Example Code</Typography.Text>
            <br />
            <br />
            <Typography.Text underline>Underline</Typography.Text>
            <br />
            <br />
            <Typography.Text delete>Deleted</Typography.Text>
            <br />
            <br />
            <Typography.Text strong>Strong</Typography.Text>
        </div>
    );
}
