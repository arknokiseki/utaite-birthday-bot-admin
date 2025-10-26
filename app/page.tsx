import { getBirthdays } from "@/lib/actions";
import { BirthdayPageClient } from "@/components/birthday-page-client";

export const revalidate = 60;

export default async function Home() {
  const bdays = await getBirthdays();

  return (
    <>
      <main className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 select-none pointer-events-none">
          Utaite Birthday Bot Admin Dashboard
        </h1>
        <BirthdayPageClient initialBirthdays={bdays} />
      </main>
      <footer className='mb-12 mt-2'>
        <div className='text-center text-lg text-slate-500 dark:text-slate-400'>
          Utaite Wiki Project
        </div>
      </footer>
    </>
  );
}