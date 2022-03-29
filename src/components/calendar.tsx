import addDays from 'date-fns/addDays';
import addMonths from 'date-fns/addMonths';
import format from 'date-fns/format';
import isSameDay from 'date-fns/isSameDay';
import isSameMonth from 'date-fns/isSameMonth';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import { useEffect, useMemo, useState } from 'react';
import { chunks } from '../utils/array';

const WEEK_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const getMonthDates = (date: Date) => {
  const start = startOfWeek(startOfMonth(date));
  const dates = [...Array(42).keys()].map((n) => addDays(start, n));

  return dates;
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
      <table>
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
          {weeks.map((dates, i) => {
            return (
              <tr key={i.toString()}>
                {dates.map((date) => (
                  <td
                    key={date.toString()}
                    aria-label={format(date, 'MMM, dd, E')}
                  >
                    <button
                      style={{
                        backgroundColor: isSameDay(date, activeDate)
                          ? 'yellow'
                          : 'transparent',
                      }}
                      onClick={() => selectDate(date)}
                    >
                      {format(date, 'dd')}
                    </button>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
