import { IconGithubLogo, IconSemiLogo } from '@fibrae/semi-icons-react';
import { Tag, Space } from '@fibrae/semi-ui-react';

export default function TagDemo() {
    return (
        <Space wrap>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle" type="light">
                Semi Design Light Tag
            </Tag>
            <Tag color="cyan" size="large" shape="circle" suffixIcon={<IconSemiLogo />} type="light">
                Semi: one component library for four frameworks
            </Tag>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle" type="ghost">
                Semi Design Ghost Tag
            </Tag>
            <Tag color="cyan" size="large" shape="circle" type="ghost" suffixIcon={<IconSemiLogo />}>
                Semi: one component library for four frameworks
            </Tag>
            <Tag color="light-blue" prefixIcon={<IconGithubLogo />} size="large" shape="circle" type="solid">
                Semi Design Solid Tag
            </Tag>
            <Tag color="cyan" size="large" shape="circle" type="solid" suffixIcon={<IconSemiLogo />}>
                Semi: one component library for four frameworks
            </Tag>
        </Space>
    );
}
