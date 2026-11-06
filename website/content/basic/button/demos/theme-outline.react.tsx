import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="outline" type="primary" style={{ marginInlineEnd: 8 }}>
                主要
            </Button>
            <Button theme="outline" type="secondary" style={{ marginInlineEnd: 8 }}>
                次要
            </Button>
            <Button theme="outline" type="tertiary" style={{ marginInlineEnd: 8 }}>
                第三
            </Button>
            <Button theme="outline" type="warning" style={{ marginInlineEnd: 8 }}>
                警告
            </Button>
            <Button theme="outline" type="danger" style={{ marginInlineEnd: 8 }}>
                危险
            </Button>
        </>
    );
}
