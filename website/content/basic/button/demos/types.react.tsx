import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <div className="btn-margin-right">
            <Button>主要按钮</Button>
            <Button type="secondary">次要按钮</Button>
            <Button type="tertiary">第三按钮</Button>
            <Button type="warning">警告按钮</Button>
            <Button type="danger">危险按钮</Button>
        </div>
    );
}
