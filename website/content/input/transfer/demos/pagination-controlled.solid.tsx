import { createSignal } from 'solid-js';
import { Transfer, ButtonGroup, Button } from '@fibrae/semi-ui-solid';

const data = Array.from({ length: 100 }, (_, i) => {
    return {
        label: `选项名称 ${i}`,
        value: i,
        disabled: false,
        key: `key-${i}`,
    };
});

export default function TransferDemo() {
    const [currentPage, setCurrentPage] = createSignal(1);
    return (
        <div>
            <ButtonGroup style={{ 'margin-bottom': '12px' }}>
                <Button onClick={() => setCurrentPage(1)}>第1页</Button>
                <Button onClick={() => setCurrentPage(2)}>第2页</Button>
                <Button onClick={() => setCurrentPage(5)}>第5页</Button>
                <Button onClick={() => setCurrentPage(10)}>第10页</Button>
            </ButtonGroup>
            <div>当前页码: {currentPage()}</div>
            <Transfer
                style={{ width: '568px', height: '416px' }}
                dataSource={data}
                pagination={{
                    pageSize: 10,
                    currentPage: currentPage(),
                    onPageChange: (page) => setCurrentPage(page),
                }}
                onChange={(values, items) => console.log(values, items)}
            />
        </div>
    );
}
