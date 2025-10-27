'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';

import { Birthday, BirthdaySchema } from '@/lib/definitions';
import { createBirthday, updateBirthday } from '@/lib/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BirthdayFormProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    birthday?: Birthday | null;
    onSuccess: () => void;
}

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button aria-label="Submit Form" type="submit" className='cursor-pointer' disabled={pending}>
            {pending ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Birthday'}
        </Button>
    );
}

type ActionState = {
    success?: boolean;
    message: string;
    errors?: {
        id?: string[];
        utaiteName?: string[];
        birthday?: string[];
        twitterLink?: string[];
    };
};

const MONTHS = [
    { value: '01', label: 'January', days: 31 },
    { value: '02', label: 'February', days: 29 },
    { value: '03', label: 'March', days: 31 },
    { value: '04', label: 'April', days: 30 },
    { value: '05', label: 'May', days: 31 },
    { value: '06', label: 'June', days: 30 },
    { value: '07', label: 'July', days: 31 },
    { value: '08', label: 'August', days: 31 },
    { value: '09', label: 'September', days: 30 },
    { value: '10', label: 'October', days: 31 },
    { value: '11', label: 'November', days: 30 },
    { value: '12', label: 'December', days: 31 },
];

function formatDate(date: Date | undefined) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function isValidDate(date: Date | undefined) {
    if (!date) return false;
    return !isNaN(date.getTime());
}

export function BirthdayForm({ isOpen, setIsOpen, birthday, onSuccess }: BirthdayFormProps) {
    const isEditMode = !!birthday;
    const action = isEditMode ? updateBirthday : createBirthday;
    const previousBirthdayIdRef = useRef(birthday?._id?.toString() || '');
    const router = useRouter();

    const initialState: ActionState = { message: '', errors: {} };
    const [state, dispatch] = useActionState(action, initialState);

    // Determine if existing birthday has year
    const existingBirthdayHasYear = birthday?.birthday?.split('-').length === 3;
    
    const [dateFormat, setDateFormat] = useState<'with-year' | 'without-year'>(
        existingBirthdayHasYear ? 'with-year' : 'without-year'
    );
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedDay, setSelectedDay] = useState<string>('');
    const [isInitializing, setIsInitializing] = useState(false);
    const [monthOpen, setMonthOpen] = useState(false);
    const [dayOpen, setDayOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [calendarMonth, setCalendarMonth] = useState<Date | undefined>();
    const [inputValue, setInputValue] = useState('');

    const { register, formState: { errors }, reset, setValue } = useForm({
        resolver: zodResolver(BirthdaySchema),
        defaultValues: {
            id: birthday?._id.toString() || '',
            utaiteName: birthday?.utaiteName || '',
            birthday: birthday?.birthday || '',
            twitterLink: birthday?.twitterLink || '',
        }
    });

    // Initialize date inputs from existing birthday
    useEffect(() => {
        if (birthday?.birthday) {
            setIsInitializing(true);
            const parts = birthday.birthday.split('-');
            if (parts.length === 3) {
                // YYYY-MM-DD format
                const date = new Date(birthday.birthday);
                setSelectedDate(date);
                setCalendarMonth(date);
                setInputValue(formatDate(date));
                setDateFormat('with-year');
            } else if (parts.length === 2) {
                // MM-DD format
                setSelectedMonth(parts[0]);
                setSelectedDay(parts[1]);
                setDateFormat('without-year');
            }
            // Small delay to ensure state is set before clearing initialization flag
            setTimeout(() => setIsInitializing(false), 0);
        }
    }, [birthday]);

    useEffect(() => {
        if (state.message?.startsWith('Success')) {
            toast.success(state.message);
            onSuccess();
            setIsOpen(false);
            reset({ id: '', utaiteName: '', birthday: '', twitterLink: '' });
            setSelectedMonth('');
            setSelectedDay('');
            setSelectedDate(undefined);
            setInputValue('');
        } else if (state.message?.startsWith('Error: Not authenticated')) {
            toast.error('Session expired. Please log in again.');
            router.push('/auth');
        } else if (state.message && state.message !== '') {
            toast.error(state.message);
        }
    }, [state, setIsOpen, onSuccess, reset, router]);

    useEffect(() => {
        const currentBirthdayId = birthday?._id?.toString() || '';
        if (currentBirthdayId !== previousBirthdayIdRef.current) {
            reset({
                id: currentBirthdayId,
                utaiteName: birthday?.utaiteName || '',
                birthday: birthday?.birthday || '',
                twitterLink: birthday?.twitterLink || '',
            });
            previousBirthdayIdRef.current = currentBirthdayId;
        }
    }, [birthday, reset]);

    // Update birthday field when format or values change
    useEffect(() => {
        if (dateFormat === 'with-year' && selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            setValue('birthday', `${year}-${month}-${day}`);
        } else if (dateFormat === 'without-year' && selectedMonth && selectedDay) {
            setValue('birthday', `${selectedMonth}-${selectedDay}`);
        }
    }, [dateFormat, selectedDate, selectedMonth, selectedDay, setValue]);

    // Reset day when month changes (but not during initialization)
    useEffect(() => {
        if (dateFormat === 'without-year' && !isInitializing) {
            setSelectedDay('');
        }
    }, [selectedMonth, dateFormat, isInitializing]);

    const getDaysInMonth = (monthValue: string) => {
        const month = MONTHS.find(m => m.value === monthValue);
        return month ? Array.from({ length: month.days }, (_, i) => ({
            value: String(i + 1).padStart(2, '0'),
            label: String(i + 1)
        })) : [];
    };

    const getMonthLabel = (value: string) => {
        return MONTHS.find(m => m.value === value)?.label || 'Select month';
    };

    const getDayLabel = (value: string) => {
        return value ? value.replace(/^0/, '') : 'Select day';
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen} modal={true}>
            <DialogContent className="sm:max-w-[425px] w-[95%]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Birthday' : 'Add New Birthday'}</DialogTitle>
                </DialogHeader>
                <form action={dispatch}>
                    {isEditMode && <input type="hidden" {...register('id')} />}
                    <input type="hidden" {...register('birthday')} />
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="utaiteName" className="sm:text-right">Name</Label>
                            <Input id="utaiteName" {...register('utaiteName')} className="sm:col-span-3 w-full" />
                            {(errors.utaiteName || state.errors?.utaiteName) && 
                                <p className="sm:col-span-4 text-sm text-red-500 text-right">
                                    {errors.utaiteName?.message || state.errors?.utaiteName?.[0]}
                                </p>
                            }
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4">
                            <Label className="sm:text-right sm:pt-2">Format</Label>
                            <RadioGroup 
                                value={dateFormat} 
                                onValueChange={(value) => setDateFormat(value as 'with-year' | 'without-year')}
                                className="sm:col-span-3"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="with-year" id="with-year" />
                                    <Label htmlFor="with-year" className="font-normal cursor-pointer">With Year</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="without-year" id="without-year" />
                                    <Label htmlFor="without-year" className="font-normal cursor-pointer">Without Year</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {dateFormat === 'with-year' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="sm:text-right">Birthday</Label>
                                <div className="sm:col-span-3 relative flex gap-2">
                                    <Input
                                        id="date"
                                        value={inputValue}
                                        placeholder="June 01, 2025"
                                        className="bg-background pr-10"
                                        onChange={(e) => {
                                            const date = new Date(e.target.value);
                                            setInputValue(e.target.value);
                                            if (isValidDate(date) && date <= today) {
                                                setSelectedDate(date);
                                                setCalendarMonth(date);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                setCalendarOpen(true);
                                            }
                                        }}
                                    />
                                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date-picker"
                                                variant="ghost"
                                                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                                                type="button"
                                            >
                                                <CalendarIcon className="size-3.5" />
                                                <span className="sr-only">Select date</span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto overflow-hidden p-0"
                                            align="end"
                                            alignOffset={-8}
                                            sideOffset={10}
                                            style={{ pointerEvents: 'auto', zIndex: 9999 }}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                captionLayout="dropdown"
                                                month={calendarMonth}
                                                onMonthChange={setCalendarMonth}
                                                onSelect={(date) => {
                                                    if (date && date <= today) {
                                                        setSelectedDate(date);
                                                        setInputValue(formatDate(date));
                                                        setCalendarOpen(false);
                                                    }
                                                }}
                                                disabled={(date) => date > today}
                                                defaultMonth={today}
                                                toDate={today}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label className="sm:text-right">Birthday</Label>
                                <div className="sm:col-span-3 grid grid-cols-2 gap-2">
                                    <Popover open={monthOpen} onOpenChange={setMonthOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={monthOpen}
                                                className="justify-between"
                                                type="button"
                                            >
                                                {getMonthLabel(selectedMonth)}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                            className="w-[200px] p-0" 
                                            align="start"
                                            style={{ pointerEvents: 'auto', zIndex: 9999 }}
                                            onWheel={(e) => e.stopPropagation()}
                                        >
                                            <Command className="max-h-[300px]">
                                                <CommandInput placeholder="Search month..." />
                                                <CommandList>
                                                    <CommandEmpty>No month found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {MONTHS.map((month) => (
                                                            <CommandItem
                                                                key={month.value}
                                                                value={`${month.label} ${month.value}`}
                                                                onSelect={() => {
                                                                    setSelectedMonth(month.value);
                                                                    setMonthOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedMonth === month.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {month.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    <Popover open={dayOpen} onOpenChange={setDayOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={dayOpen}
                                                className="justify-between"
                                                disabled={!selectedMonth}
                                                type="button"
                                            >
                                                {getDayLabel(selectedDay)}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                            className="w-[150px] p-0" 
                                            align="start"
                                            style={{ pointerEvents: 'auto', zIndex: 9999 }}
                                            onWheel={(e) => e.stopPropagation()}
                                        >
                                            <Command className="max-h-[300px]">
                                                <CommandInput placeholder="Search day..." />
                                                <CommandList>
                                                    <CommandEmpty>No day found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {getDaysInMonth(selectedMonth).map((day) => (
                                                            <CommandItem
                                                                key={day.value}
                                                                value={day.label}
                                                                onSelect={() => {
                                                                    setSelectedDay(day.value);
                                                                    setDayOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedDay === day.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {day.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}

                        {(errors.birthday || state.errors?.birthday) && 
                            <p className="text-sm text-red-500 text-right">
                                {errors.birthday?.message || state.errors?.birthday?.[0]}
                            </p>
                        }

                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                            <Label htmlFor="twitterLink" className="sm:text-right">Twitter URL</Label>
                            <Input id="twitterLink" placeholder="https://twitter.com/..." {...register('twitterLink')} className="sm:col-span-3 w-full" />
                            {(errors.twitterLink || state.errors?.twitterLink) && 
                                <p className="sm:col-span-4 text-sm text-red-500 text-right">
                                    {errors.twitterLink?.message || state.errors?.twitterLink?.[0]}
                                </p>
                            }
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="w-full sm:w-auto" type="button">
                                Cancel
                            </Button>
                        </DialogClose>
                        <SubmitButton isEditMode={isEditMode} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}