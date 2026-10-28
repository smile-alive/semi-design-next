import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={80} showSizeChanger style={{ marginBottom: 12 }} />
            <Pagination total={300} showSizeChanger />
        </div>
    );
}
