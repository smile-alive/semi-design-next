import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="solid" type="primary" style={{ marginInlineEnd: 8 }}>
                深色主要
            </Button>
            <Button theme="solid" type="secondary" style={{ marginInlineEnd: 8 }}>
                深色次要
            </Button>
            <Button theme="solid" type="tertiary" style={{ marginInlineEnd: 8 }}>
                深色第三
            </Button>
            <Button theme="solid" type="warning" style={{ marginInlineEnd: 8 }}>
                深色警告
            </Button>
            <Button theme="solid" type="danger" style={{ marginInlineEnd: 8 }}>
                深色危险
            </Button>
        </>
    );
}
