import { Button } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <div class="btn-margin-right">
            <Button>主要按钮</Button>
            <Button type="secondary">次要按钮</Button>
            <Button type="tertiary">第三按钮</Button>
            <Button type="warning">警告按钮</Button>
            <Button type="danger">危险按钮</Button>
        </div>
    );
}
