import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-solid';
import { Space, Tag } from '@fibrae/semi-ui-solid';

export default function TagDemo() {
    return (
        <Space wrap>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle" type="light">
                Semi Design Light Tag
            </Tag>
            <Tag color="cyan" size="large" shape="circle" suffixIcon={<IconSemiLogo />} type="light">
                D2C: figma to code in one click
            </Tag>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle" type="ghost">
                Semi Design Ghost Tag
            </Tag>
            <Tag color="cyan" size="large" shape="circle" type="ghost" suffixIcon={<IconSemiLogo />}>
                D2C: figma to code in one click
            </Tag>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle" type="solid">
                Semi Design Solid Tag
            </Tag>
            <Tag color="cyan" size="large" shape="circle" type="solid" suffixIcon={<IconSemiLogo />}>
                D2C: figma to code in one click
            </Tag>
        </Space>
    );
}
