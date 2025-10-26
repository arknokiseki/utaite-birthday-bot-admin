'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
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
// import { BirthdayForm } from './birthday-form';
import { deleteBirthday } from '@/lib/actions';
import { Birthday, FilterValues } from '@/lib/definitions';
import { PaginationControls } from './pagination-controls';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquareTwitter } from '@fortawesome/free-brands-svg-icons'

const BirthdayForm = dynamic(
  () => import('./birthday-form').then(m => m.BirthdayForm),
  { ssr: false, loading: () => null }
);

const SkeletonRow = () => (
    <TableRow>
        <TableCell><div className="h-5 w-32 rounded bg-muted animate-pulse" /></TableCell>
        <TableCell><div className="h-5 w-24 rounded bg-muted animate-pulse" /></TableCell>
        <TableCell><div className="h-5 w-8 rounded bg-muted animate-pulse" /></TableCell>
        <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
                <div className="h-8 w-16 rounded bg-muted animate-pulse" />
                <div className="h-8 w-16 rounded bg-muted animate-pulse" />
            </div>
        </TableCell>
    </TableRow>
);

const SkeletonCard = () => (
    <div className="border rounded-md p-3 bg-card">
        <div className="flex items-start justify-between gap-2">
            <div>
                <div className="h-5 w-28 rounded bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted animate-pulse mt-2" />
            </div>
            <div className="flex flex-col items-end space-y-2">
                <div className="h-6 w-6 rounded bg-muted animate-pulse" />
                <div className="flex space-x-2">
                    <div className="h-8 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-8 w-16 rounded bg-muted animate-pulse" />
                </div>
            </div>
        </div>
    </div>
);

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
            <Button aria-label="Sort" variant="ghost" onClick={handleClick}>
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
            .filter(([, value]) => value && value !== 'all')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return activeFilters ? `No data found with filters: ${activeFilters}` : 'No data found.';
    }, [filters]);

    return (
        <>
        <div className="flex justify-end mb-4">
            <Button aria-label="Add Birthday" className='cursor-pointer' onClick={handleAdd}>Add Birthday</Button>
        </div>

        {isLoading ? (
            <div className="rounded-md border overflow-x-auto hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <Header sortKey="utaiteName" sorting={sorting} setSorting={setSorting} className="min-w-[200px]">Name</Header>
                            <Header sortKey="birthday" sorting={sorting} setSorting={setSorting} className="min-w-[160px]">Birthday</Header>
                            <TableHead className="min-w-[120px]">Twitter</TableHead>
                            <TableHead className="text-right min-w-[160px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: rowsPerPage }).map((_, i) => (
                            <SkeletonRow key={i} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        ) : (
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
                        {paginatedBirthdays.length > 0 ? (
                            paginatedBirthdays.map((bday) => (
                                <TableRow key={bday._id.toString()}>
                                    <TableCell className="font-medium">
                                        <Link href={`https://utaite.miraheze.org/wiki/${bday.utaiteName}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" aria-label="Visit -hotoke-'s page on the wiki">
                                            {bday.utaiteName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{bday.birthday}</TableCell>
                                    <TableCell>
                                        {bday.twitterLink ? (
                                            <Link href={bday.twitterLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" aria-label={`Visit ${bday.utaiteName}'s Twitter profile`}>
                                                <FontAwesomeIcon icon={faSquareTwitter} className='fa-lg' />
                                            </Link>
                                        ) : ('N/A')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button aria-label="Edit Birthday" variant="outline" size="sm" className="mr-2 cursor-pointer" onClick={() => handleEdit(bday)}>Edit</Button>
                                        <Button aria-label="Delete Birthday" variant="destructive" size="sm" className='cursor-pointer' onClick={() => handleDeleteClick(bday._id.toString())}>Delete</Button>
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
        )}

        {isLoading ? (
            <div className="md:hidden space-y-3">
                {Array.from({ length: rowsPerPage }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        ) : (
            <div className="md:hidden space-y-3">
                {paginatedBirthdays.length > 0 ? (
                    paginatedBirthdays.map((bday) => (
                        <div key={bday._id.toString()} className="border rounded-md p-3 bg-card">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-medium text-base">
                                        <Link href={`https://utaite.miraheze.org/wiki/${bday.utaiteName}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" aria-label={`Visit ${bday.utaiteName}'s page on the wiki`}>
                                            {bday.utaiteName}
                                        </Link>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{bday.birthday}</div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <div>
                                        {bday.twitterLink ? (
                                            <Link href={bday.twitterLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" aria-label={`Visit ${bday.utaiteName}'s Twitter profile`}>
                                                <FontAwesomeIcon icon={faSquareTwitter} className='fa-lg' />
                                            </Link>
                                        ) : ('N/A')}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button aria-label="Edit Birthday" variant="outline" size="sm" className="cursor-pointer" onClick={() => handleEdit(bday)}>Edit</Button>
                                        <Button aria-label="Delete Birthday" variant="destructive" size="sm" className='cursor-pointer' onClick={() => handleDeleteClick(bday._id.toString())}>Delete</Button>
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
        )}

        <PaginationControls
            totalRows={filteredAndSortedBirthdays.length}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
        />
        {isFormOpen ? (
            <BirthdayForm
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                birthday={selectedBirthday}
                onSuccess={onDataChange}
            />
        ) : null}

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
                    <AlertDialogAction className="hover:cursor-pointer" onClick={handleConfirmDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}