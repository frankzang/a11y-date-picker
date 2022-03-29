import addDays from 'date-fns/addDays';
import addMonths from 'date-fns/addMonths';
import format from 'date-fns/format';
import { isEqual } from 'date-fns/fp';
import isAfter from 'date-fns/isAfter';
import isBefore from 'date-fns/isBefore';
import isSameDay from 'date-fns/isSameDay';
import isSameMonth from 'date-fns/isSameMonth';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import { useEffect, useMemo, useRef, useState } from 'react';
import { chunks } from '../utils/array';

const WEEK_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const getMonthDates = (date: Date) => {
  const start = startOfWeek(startOfMonth(date));
  const dates = [...Array(42).keys()].map((n) => addDays(start, n));

  return dates;
};

const enableFirstAvailableDate = () => document.querySelector('tr td[data-disabled="false"]')?.setAttribute('tabindex', '0');

const useTableKeyboardNavigation = () => {
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    enableFirstAvailableDate();
    const onKeyPress = (e: KeyboardEvent) => {
      const elm = (e.target as HTMLElement).closest('td')!;
      const parent = elm.parentElement;
      const { col } = elm?.dataset;

      switch (e.key) {
        case 'ArrowUp':
          const up = parent?.previousElementSibling?.querySelector(
            `[data-col="${col}"][data-disabled="false"]`
          ) as HTMLElement;

          if(!up) return;
          
          elm.setAttribute('tabindex', '-1');
          up.setAttribute('tabindex', '0');
          up?.focus();
          return;
        case 'ArrowDown':
          const down = parent?.nextElementSibling?.querySelector(
            `[data-col="${col}"][data-disabled="false"]`
          ) as HTMLElement;

          if(!down) return;
          
          elm.setAttribute('tabindex', '-1');
          down?.setAttribute('tabindex', '0');
          down?.focus();
          return;
        case 'ArrowLeft':
          const left = elm?.previousElementSibling as HTMLElement;
          if(left?.getAttribute('data-disabled') === 'true') return;

          elm.setAttribute('tabindex', '-1');
          left?.setAttribute('tabindex', '0');
          left?.focus();
          return;
        case 'ArrowRight':
          const right = elm?.nextElementSibling as HTMLElement;
          if(right?.getAttribute('data-disabled') === 'true') return;

          elm.setAttribute('tabindex', '-1');
          right?.setAttribute('tabindex', '0');
          right?.focus();
          return;
        case ' ':
        case 'Enter':
          elm.querySelector('button')?.click();
          return;
        default:
          return;
      }
    };

    tableRef.current?.addEventListener('keydown', onKeyPress);

    return () => tableRef.current?.removeEventListener('keydown', onKeyPress);
  }, []);

  return tableRef;
};

type CalendarProps = {
  date?: Date;
  min?: Date;
  max?: Date;
  onClick?(date: Date): void;
};

export const Calendar = ({ date, min, max, onClick }: CalendarProps) => {
  const [activeMonth, setActiveMonthDate] = useState(() => date ?? new Date());
  const [activeDate, setActiveDate] = useState<Date>(date ?? new Date());
  const month = useMemo(() => getMonthDates(activeMonth), [activeMonth]);
  const weeks = useMemo(() => chunks(month, 7), [month]);
  const ref = useTableKeyboardNavigation();

  const prevMonth = () => {
    setActiveMonthDate((date) => subMonths(date, 1));
  };

  const nextMonth = () => {
    setActiveMonthDate((date) => addMonths(date, 1));
  };

  const selectDate = (date: Date) => {
    setActiveDate(date);
    setActiveMonthDate(date);
    onClick?.(date);
  };

  useEffect(() => {
    if (!date) return;

    if (isSameDay(date, activeDate)) return;

    setActiveDate(date);
    setActiveMonthDate(date);
  }, [date, selectDate]);

  useEffect(() => enableFirstAvailableDate(), [activeMonth])

  return (
    <div>
      {activeDate.toLocaleDateString()}
      <div role="log" aria-live="polite" aria-relevant="text">
        {format(activeMonth, 'MMMM, yyyy')}
      </div>
      <div>
        <button
          onClick={prevMonth}
          disabled={min && isSameMonth(min, activeMonth)}
        >
          Prev
        </button>{' '}
        <button
          onClick={nextMonth}
          disabled={max && isSameMonth(max, activeMonth)}
        >
          Next
        </button>
      </div>
      <table ref={ref}>
        <caption>{format(activeMonth, 'MMMM')}</caption>
        <thead>
          <tr>
            {WEEK_DAYS.map((day) => (
              <th key={day} scope="col">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((days, row) => {
            return (
              <tr key={row.toString()}>
                {days.map((date, col) => {
                  const isDateSelected = isSameDay(date, activeDate);
                  const isDateDisabled =
                    (min && isBefore(date, min)) ||
                    (max && (isEqual(date, max) || isAfter(date, max)));

                  return (
                    <td
                      key={date.toString()}
                      aria-label={format(date, 'MMM, dd, E')}
                      aria-selected={isDateSelected}
                      data-row={row}
                      data-col={col}
                      data-disabled={isDateDisabled}
                    >
                      <button
                       tabIndex={-1}
                        disabled={isDateDisabled}
                        style={{
                          backgroundColor: isDateSelected
                            ? 'yellow'
                            : 'transparent',
                        }}
                        onClick={() => selectDate(date)}
                      >
                        {format(date, 'dd')}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
