import { useState } from 'react';
import { Transfer, ButtonGroup, Button } from '@fibrae/semi-ui-react';

export default function TransferDemo() {
    const [currentPage, setCurrentPage] = useState(1);
    const data = Array.from({ length: 100 }, (_v, i) => {
        return {
            label: `选项名称 ${i}`,
            value: i,
            disabled: false,
            key: `key-${i}`,
        };
    });
    return (
        <div>
            <ButtonGroup style={{ marginBottom: 12 }}>
                <Button onClick={() => setCurrentPage(1)}>第1页</Button>
                <Button onClick={() => setCurrentPage(2)}>第2页</Button>
                <Button onClick={() => setCurrentPage(5)}>第5页</Button>
                <Button onClick={() => setCurrentPage(10)}>第10页</Button>
            </ButtonGroup>
            <div>当前页码: {currentPage}</div>
            <Transfer
                style={{ width: 568, height: 416 }}
                dataSource={data}
                pagination={{
                    pageSize: 10,
                    currentPage,
                    onPageChange: (page) => setCurrentPage(page),
                }}
                onChange={(values, items) => console.log(values, items)}
            />
        </div>
    );
}
