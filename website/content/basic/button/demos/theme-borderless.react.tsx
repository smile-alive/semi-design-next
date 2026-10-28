import { Button } from '@fibrae/semi-ui-react';

export default function ButtonDemo() {
    return (
        <>
            <Button theme="borderless" type="primary" style={{ marginRight: 8 }}>
                主要
            </Button>
            <Button theme="borderless" type="secondary" style={{ marginRight: 8 }}>
                次要
            </Button>
            <Button theme="borderless" type="tertiary" style={{ marginRight: 8 }}>
                第三
            </Button>
            <Button theme="borderless" type="warning" style={{ marginRight: 8 }}>
                警告
            </Button>
            <Button theme="borderless" type="danger" style={{ marginRight: 8 }}>
                危险
            </Button>
        </>
    );
}
