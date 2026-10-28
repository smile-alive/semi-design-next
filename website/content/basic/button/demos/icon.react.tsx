import { IconCamera, IconSidebar, IconChevronDown } from '@fibrae/semi-icons-react';
import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <div>
            <strong>默认状态：</strong>
            <Button icon={<IconCamera />} aria-label="截屏" />
            <br />
            <br />
            <strong>禁用状态：</strong>
            <Button disabled icon={<IconCamera />} aria-label="截屏" />
            <br />
            <br />
            <strong>复合类型：</strong>
            <span className="btn-margin-right">
                <Button type="primary" icon={<IconCamera />} aria-label="截屏" />
                <Button type="secondary" icon={<IconCamera />} aria-label="截屏" />
                <Button type="warning" icon={<IconCamera />} aria-label="截屏" />
                <Button type="danger" icon={<IconCamera />} aria-label="截屏" />
            </span>
            <br />
            <br />
            <strong>更改主题：</strong>
            <Button icon={<IconCamera />} theme="solid" style={{ marginRight: 10 }} aria-label="截屏" />
            <Button icon={<IconCamera />} theme="light" aria-label="截屏" />
            <br />
            <br />
            <strong>更改图标位置：</strong>
            <Button icon={<IconSidebar />} theme="solid" style={{ marginRight: 10 }}>
                收起
            </Button>
            <Button icon={<IconChevronDown />} theme="solid" iconPosition="right">
                展开选项
            </Button>
            <br />
            <br />
        </div>
    );
}
