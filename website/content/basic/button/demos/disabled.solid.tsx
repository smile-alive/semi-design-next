import { Button } from '@fibrae/semi-ui-solid';

export default function ButtonDemo() {
    return (
        <div>
            <Button disabled>禁用</Button>
            <Button disabled theme="borderless">
                无背景禁用
            </Button>
            <Button disabled theme="light">
                浅色禁用
            </Button>
            <Button disabled theme="borderless" type="primary">
                无背景主要禁用
            </Button>
            <Button disabled theme="solid" type="warning">
                深色警告禁用
            </Button>
        </div>
    );
}
