import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={300} showSizeChanger style={{ marginBottom: 12 }} pageSizeOpts={[50, 80, 90, 200]} />
            <Pagination total={300} showSizeChanger pageSizeOpts={[10, 20, 50, 200]} />
        </div>
    );
}
