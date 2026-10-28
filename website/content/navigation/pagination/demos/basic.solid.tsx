import { Pagination } from '@fibrae/semi-ui-solid';

export default function PaginationDemo() {
    return (
        <div>
            <Pagination total={30} style={{ 'margin-bottom': '12px' }} />
            <Pagination total={80} style={{ 'margin-bottom': '12px' }} />
            <Pagination total={200} style={{ 'margin-bottom': '12px' }} />
            <Pagination total={80} pageSize={30} style={{ 'margin-bottom': '12px' }} />
        </div>
    );
}
