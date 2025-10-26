'use client';

import { useState, useCallback } from 'react';
import { getBirthdays } from "@/lib/actions";
import { BirthdayTable } from "@/components/birthday-table";
import { FilterControls } from "@/components/filter-controls";
import { Birthday, FilterValues } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'

config.autoAddCss = false

interface BirthdayPageClientProps {
  initialBirthdays: Birthday[];
}

export function BirthdayPageClient({ initialBirthdays }: BirthdayPageClientProps) {
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
  const router = useRouter();

  const refreshBirthdays = useCallback(async () => {
    setIsLoading(true);
    try {
      const bdays = await getBirthdays();
      setBirthdays(bdays);
    } catch (error) {
      toast.error(`Session expired. Please log in again. \n${error}`);
      router.push('/auth');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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