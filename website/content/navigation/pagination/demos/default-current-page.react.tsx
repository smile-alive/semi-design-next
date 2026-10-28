import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={80} showTotal defaultCurrentPage={3} />
        </div>
    );
}
