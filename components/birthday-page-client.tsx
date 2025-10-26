'use client';

import { useState, useCallback } from 'react';
import { getBirthdays } from "@/lib/actions";
import { BirthdayTable } from "@/components/birthday-table";
import { FilterControls } from "@/components/filter-controls";
import { Birthday, FilterValues } from '@/lib/definitions';

interface BirthdayPageClientProps {
  initialBirthdays: Birthday[];
}

export function BirthdayPageClient({ initialBirthdays }: BirthdayPageClientProps) {
  // 1. Initial state is set from the server prop, not useEffect
  const [birthdays, setBirthdays] = useState<Birthday[]>(initialBirthdays);
  const [filters, setFilters] = useState<FilterValues>({
    name: 'all',
    year: 'all',
    twitter: 'all',
    search: '',
    month: 'all',
    day: 'all'
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const refreshBirthdays = useCallback(async () => {
    setIsLoading(true);
    const bdays = await getBirthdays();
    setBirthdays(bdays);
    setIsLoading(false);
  }, []);

  return (
    <>
      <FilterControls filters={filters} setFilters={setFilters} />
      <BirthdayTable
        initialBirthdays={birthdays}
        filters={filters}
        onDataChange={refreshBirthdays}
        isLoading={isLoading}
      />
    </>
  );
}