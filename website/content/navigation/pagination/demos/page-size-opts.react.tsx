import { Pagination } from '@fibrae/semi-ui-react';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Page sizes 50 to 200" total={300} showSizeChanger style={{ marginBlockEnd: 12 }} pageSizeOpts={[50, 80, 90, 200]} />
            <Pagination aria-label="Page sizes 10 to 200" total={300} showSizeChanger pageSizeOpts={[10, 20, 50, 200]} />
        </div>
    );
}
