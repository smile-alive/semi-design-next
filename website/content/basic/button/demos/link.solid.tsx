import { IconLink } from '@fibrae/semi-icons-solid';
import { Typography } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <div>
            <Typography.Text link={{ href: 'https://semi-design-next.pages.dev/' }}>链接文本</Typography.Text>
            <br />
            <br />
            <Typography.Text link={{ href: 'https://semi-design-next.pages.dev/' }}>打开网站</Typography.Text>
            <br />
            <br />
            <Typography.Text link icon={<IconLink />} underline>
                带下划线的网页链接
            </Typography.Text>
        </div>
    );
}
