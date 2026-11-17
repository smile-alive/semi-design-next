import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination aria-label="Page sizes 50 to 200" total={300} showSizeChanger style={{ 'margin-block-end': '12px' }} pageSizeOpts={[50, 80, 90, 200]} />
            <Pagination aria-label="Page sizes 10 to 200" total={300} showSizeChanger pageSizeOpts={[10, 20, 50, 200]} />
        </div>
    );
}
