import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={80} showTotal defaultCurrentPage={3} />
        </div>
    );
}
