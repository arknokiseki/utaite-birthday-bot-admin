'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BirthdayForm } from './birthday-form';
import { deleteBirthday } from '@/lib/actions';
import { Birthday, FilterValues } from '@/lib/definitions';
import { PaginationControls } from './pagination-controls';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquareTwitter } from '@fortawesome/free-brands-svg-icons'

type SortKey = 'utaiteName' | 'birthday';

const Header = ({
    children,
    sortKey,
    sorting,
    setSorting,
    className
}: {
    children: React.ReactNode;
    sortKey: SortKey;
    sorting: { key: SortKey; direction: 'ascending' | 'descending' };
    setSorting: (sorting: { key: SortKey; direction: 'ascending' | 'descending' }) => void;
    className?: string;
}) => {
    const isSorted = sorting.key === sortKey;
    const isAscending = sorting.direction === 'ascending';

    const handleClick = () => {
        if (isSorted) {
            setSorting({ key: sortKey, direction: isAscending ? 'descending' : 'ascending' });
        } else {
            setSorting({ key: sortKey, direction: 'ascending' });
        }
    };

    return (
        <TableHead className={className}>
            <Button variant="ghost" onClick={handleClick}>
                {children}
                <ArrowUpDown className={`ml-2 h-4 w-4 ${isSorted ? 'text-blue-500' : ''}`} />
            </Button>
        </TableHead>
    );
};

export function BirthdayTable({ initialBirthdays, filters, onDataChange, isLoading }: { initialBirthdays: Birthday[], filters: FilterValues, onDataChange: () => void, isLoading: boolean }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState<Birthday | null>(null);
    
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [birthdayToDelete, setBirthdayToDelete] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sorting, setSorting] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'utaiteName', direction: 'ascending' });

    const filteredAndSortedBirthdays = useMemo(() => {
        let filtered = initialBirthdays;

        if (filters.search) {
            filtered = filtered.filter(b => b.utaiteName.toLowerCase().includes(filters.search.toLowerCase()));
        }

        if (filters.name && filters.name !== 'all') {
            const firstChar = filters.name.toLowerCase();
            if (firstChar === '#') {
                filtered = filtered.filter(b => !/^[a-z]/i.test(b.utaiteName.charAt(0)));
            } else {
                filtered = filtered.filter(b => b.utaiteName.toLowerCase().startsWith(firstChar));
            }
        }

        if (filters.month && filters.month !== 'all') {
            filtered = filtered.filter(b => {
                const parts = b.birthday.split('-');
                const month = parts.length === 3 ? parts[1] : parts[0];
                return month === filters.month;
            });
        }

        if (filters.day && filters.day !== 'all') {
            filtered = filtered.filter(b => {
                const parts = b.birthday.split('-');
                const day = parts.length === 3 ? parts[2] : parts[1];
                return day === filters.day.padStart(2, '0');
            });
        }

        if (filters.year && filters.year !== 'all') {
            if (filters.year === 'yes') {
                filtered = filtered.filter(b => /^\d{4}/.test(b.birthday));
            } else if (filters.year === 'no') {
                filtered = filtered.filter(b => !/^\d{4}/.test(b.birthday));
            }
        }

        if (filters.twitter && filters.twitter !== 'all') {
            if (filters.twitter === 'yes') {
                filtered = filtered.filter(b => b.twitterLink && b.twitterLink.trim() !== '');
            } else if (filters.twitter === 'no') {
                filtered = filtered.filter(b => !b.twitterLink || b.twitterLink.trim() === '');
            }
        }

        const sorted = [...filtered].sort((a, b) => {
            const aValue = a[sorting.key];
            const bValue = b[sorting.key];

            if (aValue < bValue) {
                return sorting.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sorting.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });

        return sorted;

    }, [initialBirthdays, filters, sorting]);

    const paginatedBirthdays = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredAndSortedBirthdays.slice(startIndex, endIndex);
    }, [filteredAndSortedBirthdays, currentPage, rowsPerPage]);


    const handleAdd = () => {
        setSelectedBirthday(null);
        setIsFormOpen(true);
    };

    const handleEdit = (birthday: Birthday) => {
        setSelectedBirthday(birthday);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setBirthdayToDelete(id);
        setIsAlertOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!birthdayToDelete) return;

        const result = await deleteBirthday(birthdayToDelete);
        if (result.message?.startsWith('Success')) {
            toast.success(result.message);
            onDataChange();
        } else {
            toast.error(result.message || 'An unknown error occurred.');
        }
        
        setIsAlertOpen(false);
        setBirthdayToDelete(null);
    };
    
    const noDataMessage = useMemo(() => {
        const activeFilters = Object.entries(filters)
            .filter(([key, value]) => value && value !== 'all')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return activeFilters ? `No data found with filters: ${activeFilters}` : 'No data found.';
    }, [filters]);

    return (
        <>
        <div className="flex justify-end mb-4">
            <Button className='cursor-pointer' onClick={handleAdd}>Add Birthday</Button>
        </div>

        {/* Desktop/table view (md+) */}
        <div className="rounded-md border overflow-x-auto hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <Header sortKey="utaiteName" sorting={sorting} setSorting={setSorting} className="min-w-[200px]">
                        Name
                    </Header>
                    <Header sortKey="birthday" sorting={sorting} setSorting={setSorting} className="min-w-[160px]">
                        Birthday
                    </Header>
                    <TableHead className="min-w-[120px]">Twitter</TableHead>
                    <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                            </TableCell>
                        </TableRow>
                    ) : paginatedBirthdays.length > 0 ? (
                        paginatedBirthdays.map((bday) => (
                            <TableRow key={bday._id.toString()}>
                                <TableCell className="font-medium">
                                    <Link href={`https://utaite.miraheze.org/wiki/${bday.utaiteName}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                        {bday.utaiteName}
                                    </Link>
                                </TableCell>
                                <TableCell>{bday.birthday}</TableCell>
                                <TableCell>
                                    {bday.twitterLink ? (
                                        <a href={bday.twitterLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                        <FontAwesomeIcon icon={faSquareTwitter} className='fa-lg' />
                                        </a>
                                    ) : ('N/A')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" className="mr-2 cursor-pointer" onClick={() => handleEdit(bday)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className='cursor-pointer' onClick={() => handleDeleteClick(bday._id.toString())}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {noDataMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        {/* Mobile/card view (below md) */}
        <div className="md:hidden space-y-3">
            {isLoading ? (
                <div className="h-24 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : paginatedBirthdays.length > 0 ? (
                paginatedBirthdays.map((bday) => (
                    <div key={bday._id.toString()} className="border rounded-md p-3 bg-card">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="font-medium text-base">
                                    <Link href={`https://utaite.miraheze.org/wiki/${bday.utaiteName}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                        {bday.utaiteName}
                                    </Link>
                                </div>
                                <div className="text-sm text-muted-foreground">{bday.birthday}</div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <div>
                                    {bday.twitterLink ? (
                                        <a href={bday.twitterLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                            <FontAwesomeIcon icon={faSquareTwitter} className='fa-lg' />
                                        </a>
                                    ) : ('N/A')}
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => handleEdit(bday)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className='cursor-pointer' onClick={() => handleDeleteClick(bday._id.toString())}>Delete</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="h-24 flex items-center justify-center">
                    {noDataMessage}
                </div>
            )}
        </div>

        <PaginationControls
            totalRows={filteredAndSortedBirthdays.length}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
        />
        <BirthdayForm
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            birthday={selectedBirthday}
            onSuccess={onDataChange}
        />

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        birthday from the database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setBirthdayToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
