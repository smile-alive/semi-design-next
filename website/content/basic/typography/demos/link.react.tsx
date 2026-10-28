import { IconLink } from '@fibrae/semi-icons-react';
import { Typography } from '@fibrae/semi-ui-react';

export default function TypographyDemo() {
    const { Text } = Typography;
    return (
        <div>
            <Text link={{ href: 'https://semi.design/' }}>链接文本</Text>
            <br />
            <br />
            <Text link={{ href: 'https://semi.design/' }}>打开网站</Text>
            <br />
            <br />
            <Text link icon={<IconLink />} underline>
                带下划线的网页链接
            </Text>
        </div>
    );
}
