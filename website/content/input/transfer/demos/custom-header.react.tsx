import { Transfer, Button, type TransferProps } from '@fibrae/semi-ui-react';

export default function TransferDemo() {
    const data = Array.from({ length: 30 }, (_v, i) => {
        return {
            label: `选项名称 ${i}`,
            value: i,
            disabled: false,
            key: `key-${i}`,
        };
    });

    const renderSourceHeader: TransferProps['renderSourceHeader'] = ({ num, showButton, allChecked, onAllClick }) => {
        return (
            <div style={{ margin: '10px 0 0 10px', height: 24, display: 'flex', alignItems: 'center' }}>
                <span>共 {num} 项</span>
                {showButton && (
                    <Button theme="borderless" type="tertiary" size="small" onClick={onAllClick}>
                        {allChecked ? '取消全选' : '全选'}
                    </Button>
                )}
            </div>
        );
    };

    const renderSelectedHeader: TransferProps['renderSelectedHeader'] = ({ num, showButton, onClear }) => {
        return (
            <div style={{ margin: '10px 0 0 10px', height: 24, display: 'flex', alignItems: 'center' }}>
                <span>{num} 项已选</span>
                {showButton && (
                    <Button theme="borderless" type="tertiary" size="small" onClick={onClear}>
                        清空
                    </Button>
                )}
            </div>
        );
    };

    return <Transfer style={{ width: 568, height: 416 }} dataSource={data} renderSourceHeader={renderSourceHeader} renderSelectedHeader={renderSelectedHeader} />;
}
