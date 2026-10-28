import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-solid';
import { Space, Tag } from '@fibrae/semi-ui-solid';

export default function TagDemo() {
    return (
        <Space>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle">
                Semi Design
            </Tag>
            <Tag color="cyan" size="large" shape="circle" suffixIcon={<IconSemiLogo />}>
                D2C: figma to code in one click
            </Tag>
        </Space>
    );
}
