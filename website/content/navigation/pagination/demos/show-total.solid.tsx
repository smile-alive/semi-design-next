import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={80} showTotal style={{ 'margin-block-end': '12px' }} />
            <Pagination total={200} showTotal style={{ 'margin-block-end': '12px' }} />
        </div>
    );
}
