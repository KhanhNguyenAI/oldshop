import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const MonthView: React.FC<{
  year: number;
  month: number;
  selectedDate?: Date | null;
  minAllowedDate?: Date;
  bookedDates?: Set<string>;
  onSelect: (date: Date) => void;
}> = ({ year, month, selectedDate, minAllowedDate, bookedDates, onSelect }) => {
  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get start day of week (0 = Sunday)
  const startDay = new Date(year, month, 1).getDay();

  // Normalize today's date (midnight) for comparison
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Use provided minAllowedDate (same weekday next week)
  const minAllowedDateNormalized = minAllowedDate 
    ? new Date(minAllowedDate.getFullYear(), minAllowedDate.getMonth(), minAllowedDate.getDate())
    : null;

  const days = [];
  // Empty cells for days before start
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-12 w-full"></div>);
  }

  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    // Normalize to midnight for comparison
    const dateNormalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check comparisons
    const isSelected = selectedDate && 
      dateNormalized.getTime() === new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
    
    const isToday = dateNormalized.getTime() === today.getTime();
    
    // Format date as YYYY-MM-DD for comparison with booked dates
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // Check if date is after or equal to min allowed date (same weekday next week)
    const isAfterMinDate = minAllowedDateNormalized ? dateNormalized.getTime() >= minAllowedDateNormalized.getTime() : false;
    
    // Check if date is already booked
    const isBooked = bookedDates ? bookedDates.has(dateStr) : false;
    
    // Date is allowed if it's after min date and not booked
    const isAllowed = isAfterMinDate && !isBooked;
    const isDisabled = !isAllowed;

    days.push(
      <button
        key={`day-${i}`}
        onClick={() => !isDisabled && onSelect(date)}
        disabled={isDisabled}
        className={`
          h-12 w-full flex items-center justify-center rounded-lg text-sm font-serif transition-all
          ${isDisabled
            ? isBooked
              ? 'text-red-400 cursor-not-allowed bg-red-50 border border-red-200 line-through opacity-60'
              : 'text-gray-300 cursor-not-allowed bg-gray-50 border border-gray-200'
            : isSelected 
              ? 'bg-amber-800 text-amber-50 font-bold shadow-lg border-2 border-amber-900' 
              : 'text-amber-900 bg-amber-100 hover:bg-amber-200 hover:shadow-md border border-amber-300 font-medium'
          }
          ${isToday && !isSelected ? 'border-2 border-amber-500 bg-amber-50 font-bold' : ''}
        `}
        title={isBooked ? '既に予約済み' : isAllowed ? '予約可能' : isDisabled ? '予約不可' : ''}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="bg-white/90 p-6 rounded-lg border-2 border-amber-200 shadow-md min-w-[320px]">
      <h3 className="text-2xl font-bold text-amber-900 text-center mb-6 font-serif">
        {year}年 {month + 1}月
      </h3>
      <div className="grid grid-cols-7 gap-2 mb-3">
        {DAYS_OF_WEEK.map((day, i) => (
          <div key={day} className={`text-center text-sm font-bold pb-2 ${i === 0 ? 'text-red-600' : 'text-amber-800'}`}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
    </div>
  );
};

export const Calendar: React.FC<CalendarProps> = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dateInput, setDateInput] = useState<string>('');
  const [dateInputError, setDateInputError] = useState<string>('');
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Calculate the same weekday next week (7 days from today) - minimum allowed date
  const sameDayNextWeek = new Date(today);
  sameDayNextWeek.setDate(today.getDate() + 7);
  // Normalize to midnight for comparison
  const minAllowedDate = new Date(sameDayNextWeek.getFullYear(), sameDayNextWeek.getMonth(), sameDayNextWeek.getDate());
  
  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Format min allowed date for input min attribute
  const minAllowedDateStr = formatDateForInput(minAllowedDate);

  // Calculate next month
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();

  // Format allowed date for display
  const formatAllowedDate = (date: Date) => {
    const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const dayName = dayNames[date.getDay()];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${dayName}）`;
  };

  // Fetch booked dates
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const dates = await bookingService.getBookedDates();
        setBookedDates(new Set(dates));
      } catch (error) {
        console.error('Failed to fetch booked dates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookedDates();
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDateInput(formatDateForInput(date));
    setDateInputError('');
    if (onDateSelect) {
      onDateSelect(date);
    }
  };
  
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInput(value);
    setDateInputError('');
    
    if (!value) {
      setSelectedDate(null);
      return;
    }
    
    const inputDate = new Date(value);
    
    // Validate date
    if (isNaN(inputDate.getTime())) {
      setDateInputError('無効な日付です');
      return;
    }
    
    // Normalize to midnight for comparison
    const inputDateNormalized = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    
    // Check if date is after or equal to min allowed date
    if (inputDateNormalized.getTime() < minAllowedDate.getTime()) {
      setDateInputError(`${formatAllowedDate(minAllowedDate)}以降の日付を選択してください`);
      return;
    }
    
    // Format date as YYYY-MM-DD for comparison with booked dates
    const dateStr = formatDateForInput(inputDate);
    
    // Check if date is already booked
    if (bookedDates.has(dateStr)) {
      setDateInputError('この日付は既に予約されています');
      return;
    }
    
    // Valid date
    setSelectedDate(inputDate);
    if (onDateSelect) {
      onDateSelect(inputDate);
    }
  };
  
  // Update dateInput when selectedDate changes from calendar
  useEffect(() => {
    if (selectedDate) {
      const formatted = formatDateForInput(selectedDate);
      setDateInput(formatted);
      setDateInputError('');
    }
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-center">
        <p className="text-sm font-bold text-amber-900 mb-1">📅 予約可能期間</p>
        <p className="text-lg font-serif text-amber-800">{formatAllowedDate(minAllowedDate)}以降</p>
        <p className="text-xs text-amber-700 mt-2">※ {formatAllowedDate(minAllowedDate)}以降の日付から予約可能です（1日1件のみ）</p>
      </div>
      
      {/* Date Input Field */}
      <div className="bg-white border-2 border-amber-200 rounded-lg p-4">
        <label htmlFor="date-input" className="block text-sm font-bold text-amber-900 mb-2">
          日付を直接入力
        </label>
        <input
          id="date-input"
          type="date"
          value={dateInput}
          onChange={handleDateInputChange}
          min={minAllowedDateStr}
          className={`
            w-full p-3 rounded-lg border-2 text-base font-serif
            ${dateInputError
              ? 'border-red-400 bg-red-50 text-red-900'
              : selectedDate && !dateInputError
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-amber-300 bg-white text-amber-900'
            }
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
          `}
          placeholder="YYYY-MM-DD"
        />
        {dateInputError && (
          <p className="mt-2 text-sm text-red-600 font-medium">{dateInputError}</p>
        )}
        {selectedDate && !dateInputError && (
          <p className="mt-2 text-sm text-amber-700 font-medium">
            選択中の日付: {formatAllowedDate(selectedDate)}
          </p>
        )}
      </div>
      {loading ? (
        <div className="text-center py-8 text-amber-700">読み込み中...</div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center items-start flex-wrap">
          <MonthView 
            year={currentYear} 
            month={currentMonth} 
            selectedDate={selectedDate}
            minAllowedDate={minAllowedDate}
            bookedDates={bookedDates}
            onSelect={handleDateSelect}
          />
          <MonthView 
            year={nextMonthYear} 
            month={nextMonth} 
            selectedDate={selectedDate}
            minAllowedDate={minAllowedDate}
            bookedDates={bookedDates}
            onSelect={handleDateSelect}
          />
        </div>
      )}
    </div>
  );
};
