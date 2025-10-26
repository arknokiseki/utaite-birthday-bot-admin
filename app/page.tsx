'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBirthdays } from "@/lib/actions";
import { BirthdayTable } from "@/components/birthday-table";
import { FilterControls } from "@/components/filter-controls";
import { Birthday, FilterValues } from '@/lib/definitions';

export default function Home() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    name: 'all',
    year: 'all',
    twitter: 'all',
    search: '',
    month: 'all',
    day: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshBirthdays = useCallback(async () => {
    setIsLoading(true);
    const bdays = await getBirthdays();
    setBirthdays(bdays);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshBirthdays();
  }, [refreshBirthdays]);

  return (
    <>
      <main className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 select-none pointer-events-none">Utaite Birthday Dashboard</h1>
        <FilterControls filters={filters} setFilters={setFilters} />
        <BirthdayTable
          initialBirthdays={birthdays}
          filters={filters}
          onDataChange={refreshBirthdays}
          isLoading={isLoading}
        />
      </main>
      <footer className='mb-12 mt-2'>
        <div className='text-center text-lg text-slate-500 dark:text-slate-400'>
          Utaite Wiki Project
        </div>
      </footer>
    </>
  );
}