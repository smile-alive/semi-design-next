import { Transfer, Button, type TransferSelectedHeaderProps, type TransferSourceHeaderProps } from '@fibrae/semi-ui-solid';

const data = Array.from({ length: 30 }, (_, i) => {
    return {
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    };
});

// the headers read their live objects in the JSX, so each renders once and follows the state
function renderSourceHeader(header: TransferSourceHeaderProps) {
    return (
        <div style={{ margin: '10px 0 0 10px', height: '24px', display: 'flex', 'align-items': 'center' }}>
            <span>共 {header.num} 项</span>
            {header.showButton && (
                <Button theme="borderless" type="tertiary" size="small" onClick={() => header.onAllClick()}>
                    {header.allChecked ? '取消全选' : '全选'}
                </Button>
            )}
        </div>
    );
}

function renderSelectedHeader(header: TransferSelectedHeaderProps) {
    return (
        <div style={{ margin: '10px 0 0 10px', height: '24px', display: 'flex', 'align-items': 'center' }}>
            <span>{header.num} 项已选</span>
            {header.showButton && (
                <Button theme="borderless" type="tertiary" size="small" onClick={() => header.onClear()}>
                    清空
                </Button>
            )}
        </div>
    );
}

export default function TransferDemo() {
    return <Transfer style={{ width: '568px', height: '416px' }} dataSource={data} renderSourceHeader={renderSourceHeader} renderSelectedHeader={renderSelectedHeader} />;
}
