import './Pagination.scss';

interface PaginationProps {
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({ page, total, pageSize, onPageChange }: PaginationProps) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <nav className="pagination-wrapper" aria-label="Page navigation">
            <ul className="pagination pagination-sm justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
                        قبلی
                    </button>
                </li>
                {pages.map((p) => (
                    <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => onPageChange(p)}>
                            {p}
                        </button>
                    </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
                        بعدی
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;