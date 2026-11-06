import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="borderless" type="primary" style={{ marginInlineEnd: 8 }}>
                主要
            </Button>
            <Button theme="borderless" type="secondary" style={{ marginInlineEnd: 8 }}>
                次要
            </Button>
            <Button theme="borderless" type="tertiary" style={{ marginInlineEnd: 8 }}>
                第三
            </Button>
            <Button theme="borderless" type="warning" style={{ marginInlineEnd: 8 }}>
                警告
            </Button>
            <Button theme="borderless" type="danger" style={{ marginInlineEnd: 8 }}>
                危险
            </Button>
        </>
    );
}
