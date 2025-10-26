import { getBirthdays } from "@/lib/actions";
import { BirthdayPageClient } from "@/components/birthday-page-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="h-9 w-96 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}

async function BirthdayContent() {
  const bdays = await getBirthdays();
  return <BirthdayPageClient initialBirthdays={bdays} />;
}

export default function Home() {
  return (
    <>
      <main className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 select-none pointer-events-none">
          Utaite Birthday Bot Admin Dashboard
        </h1>
        <Suspense fallback={<LoadingSkeleton />}>
          <BirthdayContent />
        </Suspense>
      </main>
      <footer className='mb-12 mt-2'>
        <div className='text-center text-lg text-slate-500 dark:text-slate-400'>
          Utaite Wiki Project
        </div>
      </footer>
    </>
  );
}