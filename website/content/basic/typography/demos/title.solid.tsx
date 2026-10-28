import { Typography } from '@fibrae/semi-ui-solid';

export default function TypographyDemo() {
    const { Title } = Typography;
    return (
        <div>
            <Title style={{ margin: '8px 0' }}>h1. Semi Design</Title>
            <Title heading={2} style={{ margin: '8px 0' }}>
                h2. Semi Design
            </Title>
            <Title heading={3} style={{ margin: '8px 0' }}>
                h3. Semi Design
            </Title>
            <Title heading={4} style={{ margin: '8px 0' }}>
                h4. Semi Design
            </Title>
            <Title heading={5} style={{ margin: '8px 0' }}>
                h5. Semi Design
            </Title>
            <Title heading={6} style={{ margin: '8px 0' }}>
                h6. Semi Design
            </Title>
        </div>
    );
}
