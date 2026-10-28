import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={80} showQuickJumper style={{ 'margin-bottom': '12px' }} />
            <Pagination total={300} showQuickJumper />
        </div>
    );
}
