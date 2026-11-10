import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-react';
import { Tag, Space } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    return (
        <Space>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle">
                Semi Design
            </Tag>
            <Tag color="cyan" size="large" shape="circle" suffixIcon={<IconSemiLogo />}>
                Semi: one component library for four frameworks
            </Tag>
        </Space>
    );
}
