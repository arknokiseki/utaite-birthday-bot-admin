'use client';

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface PaginationControlsProps {
    totalRows: number;
    rowsPerPage: number;
    setRowsPerPage: (value: number) => void;
    currentPage: number;
    setCurrentPage: (value: number) => void;
}

export function PaginationControls({
    totalRows,
    rowsPerPage,
    setRowsPerPage,
    currentPage,
    setCurrentPage,
}: PaginationControlsProps) {
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const handleRowsPerPageChange = (value: string) => {
        setRowsPerPage(Number(value));
        setCurrentPage(1);
    };

    const goToPage = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-3">
            <div className="flex-1 text-sm text-muted-foreground">
                Total {totalRows} rows.
            </div>
            <div className="flex items-center space-x-4 lg:space-x-6">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium hidden sm:block">Rows per page</p>
                    <Select
                        value={`${rowsPerPage}`}
                        onValueChange={handleRowsPerPageChange}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={rowsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium hidden sm:block">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            aria-label="First Page"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            aria-label="Previous Page"
                            className="h-8 w-8 p-0"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            aria-label="Next Page"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            aria-label="Last Page"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
