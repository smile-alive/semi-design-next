import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="light" type="primary" style={{ marginInlineEnd: 8 }}>
                浅色主要
            </Button>
            <Button theme="light" type="secondary" style={{ marginInlineEnd: 8 }}>
                浅色次要
            </Button>
            <Button theme="light" type="tertiary" style={{ marginInlineEnd: 8 }}>
                浅色第三
            </Button>
            <Button theme="light" type="warning" style={{ marginInlineEnd: 8 }}>
                浅色警告
            </Button>
            <Button theme="light" type="danger" style={{ marginInlineEnd: 8 }}>
                浅色危险
            </Button>
        </>
    );
}
