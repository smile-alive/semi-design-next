import { Transfer, Button, type TransferProps } from '@fibrae/semi-ui-react';

const data = Array.from({ length: 30 }, (_v, i) => {
    return {
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    };
});

const headerStyle = { margin: '10px 0 0 10px', height: 24, display: 'flex', alignItems: 'center' };

const renderSourceHeader: TransferProps['renderSourceHeader'] = (header) => {
    return (
        <div style={headerStyle}>
            <span>共 {header.num} 项</span>
            {header.showButton && (
                <Button theme="borderless" type="tertiary" size="small" onClick={header.onAllClick}>
                    {header.allChecked ? '取消全选' : '全选'}
                </Button>
            )}
        </div>
    );
};

const renderSelectedHeader: TransferProps['renderSelectedHeader'] = (header) => {
    return (
        <div style={headerStyle}>
            <span>{header.num} 项已选</span>
            {header.showButton && (
                <Button theme="borderless" type="tertiary" size="small" onClick={header.onClear}>
                    清空
                </Button>
            )}
        </div>
    );
};

export default function TransferDemo() {
    return <Transfer style={{ width: 568, height: 416 }} dataSource={data} renderSourceHeader={renderSourceHeader} renderSelectedHeader={renderSelectedHeader} />;
}
