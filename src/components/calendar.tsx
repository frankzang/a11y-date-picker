import {
  getDate,
  getMonth,
  addDays,
  addMonths,
  endOfMonth,
  subDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  startOfDay,
} from 'date-fns';
import React, { useEffect, useMemo, useReducer } from 'react';
import { chunks } from '../utils/array';
import './index.css';

const WEEK_DAYS = [
  { name: 'sunday', abbr: 'sun' },
  { name: 'monday', abbr: 'mon' },
  { name: 'tuesday', abbr: 'tue' },
  { name: 'wednesday', abbr: 'wed' },
  { name: 'thursday', abbr: 'thu' },
  { name: 'friday', abbr: 'fri' },
  { name: 'saturday', abbr: 'sat' },
];

const generateDates = (date: Date) => {
  const start = startOfWeek(startOfMonth(date));

  return [...Array(42).keys()].map((n) => addDays(start, n));
};

const generateId = (date: Date) => `_${getDate(date)}_${getMonth(date)}_`;

const isSameDayOrHigher = (date: Date, date2: Date) =>
  isSameDay(date, date2) || isAfter(date, date2);

const isSameDayOrLess = (date: Date, date2: Date) =>
  isSameDay(date, date2) || isBefore(date, date2);

const isDateInRange = (date: Date, { start, end }: any) =>
  isSameDayOrHigher(date, start) && isSameDayOrLess(date, end);

const checkIsDateInRange = (date: Date, start?: Date, end?: Date) => {
  if (start && end) return isDateInRange(date, { start, end });

  if (start) return isSameDayOrHigher(date, start);

  if (end) return isSameDayOrLess(date, end);

  return true;
};

const fixDateUnderflow = (date: Date, minDate?: Date) => {
  if (minDate && isBefore(date, minDate)) return minDate;

  return date;
};

const fixDateOverflow = (date: Date, maxDate?: Date) => {
  if (maxDate && isAfter(date, maxDate)) return startOfMonth(date);

  return date;
};

const getAttributeValue = (condition: boolean) =>
  condition ? true : undefined;

type State = {
  activeDate: Date;
  selectedDate: Date;
  minDate?: Date;
  maxDate?: Date;
  visibleDates: Date[];
};

type Action =
  | { type: 'SELECT_DATE'; data: Date }
  | { type: 'SET_ACTIVE_DATE'; data: Date }
  | { type: 'INCREMENT_MONTH' }
  | { type: 'DECREMENT_MONTH' };

const calendarReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_ACTIVE_DATE': {
      const isDateInRange = checkIsDateInRange(
        action.data,
        state.minDate,
        state.maxDate
      );
      if (!isDateInRange) return state;

      const visibleDates = generateDates(action.data);

      return {
        ...state,
        activeDate: action.data,
        visibleDates,
      };
    }

    case 'SELECT_DATE': {
      if (isSameDay(action.data, state.selectedDate)) return state;

      return {
        ...state,
        activeDate: action.data,
        selectedDate: action.data,
      };
    }

    case 'INCREMENT_MONTH': {
      const nextActiveDate = addMonths(state.activeDate, 1);
      const activeDate = fixDateOverflow(nextActiveDate, state.maxDate);

      return {
        ...state,
        activeDate,
        visibleDates: generateDates(nextActiveDate),
      };
    }

    case 'DECREMENT_MONTH': {
      const nextActiveDate = subMonths(state.activeDate, 1);
      const activeDate = fixDateUnderflow(nextActiveDate, state.minDate);

      return {
        ...state,
        activeDate,
        visibleDates: generateDates(activeDate),
      };
    }

    default:
      throw new Error('Invalid action passed to calendarReducer');
  }
};

type CalendarProps = {
  date?: Date;
  min?: Date;
  max?: Date;
  tileContent?: (date: Date) => string;
  onSelect?(date: Date): void;
};
export const Calendar = ({
  date,
  min,
  max,
  tileContent,
  onSelect,
}: CalendarProps) => {
  const [state, dispatch] = useReducer(
    calendarReducer,
    {
      activeDate: new Date(),
      selectedDate: new Date(),
      visibleDates: [],
      activeMonth: new Date(),
    },
    (state): State => {
      const initialActiveDate = date ?? state.activeDate;
      const visibleDates = generateDates(initialActiveDate);

      return {
        ...state,
        activeDate: initialActiveDate,
        selectedDate: initialActiveDate,
        minDate: min ? startOfDay(min) : undefined,
        maxDate: max ? startOfDay(max) : undefined,
        visibleDates,
      };
    }
  );
  const weeks = useMemo(
    () => chunks(state.visibleDates, 7),
    [state.visibleDates]
  );
  const isPrevDisabled =
    min && isBefore(endOfMonth(subMonths(state.activeDate, 1)), min);
  const isNextDisabled =
    max && isAfter(startOfMonth(addMonths(state.activeDate, 1)), max);
  const activeDescendant = generateId(state.activeDate);

  const handlePrevMonth = () => {
    dispatch({ type: 'DECREMENT_MONTH' });
  };

  const handleNextMonth = () => {
    dispatch({ type: 'INCREMENT_MONTH' });
  };

  const onSelectDate = (date: Date) => {
    dispatch({ type: 'SELECT_DATE', data: date });
    onSelect?.(date);
  };

  const onKeyDown = (evt: React.KeyboardEvent<HTMLTableElement>) => {
    const keyboardEventHandlers: Record<string, (() => void) | undefined> = {
      ArrowUp: () =>
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: subDays(state.activeDate, 7),
        }),
      ArrowDown: () =>
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: addDays(state.activeDate, 7),
        }),
      ArrowLeft: () =>
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: subDays(state.activeDate, 1),
        }),
      ArrowRight: () =>
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: addDays(state.activeDate, 1),
        }),
      Home: () =>
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: startOfMonth(state.activeDate),
        }),
      End: () =>
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: endOfMonth(state.activeDate),
        }),
      Enter: () => {
        const currentActiveCell =
          evt.currentTarget.querySelector<HTMLTableCellElement>(
            `#${generateId(state.activeDate)}`
          )!;
        const isDisabled = currentActiveCell.hasAttribute(
          'data-datacell-disabled'
        );
        if (isDisabled) return;

        onSelectDate(state.activeDate);
      },
    };

    const keyHandler = keyboardEventHandlers[evt.key];
    if (!keyHandler) return;

    evt.preventDefault();
    keyHandler();
  };

  // Keep the date from the props in sync with the date on state
  useEffect(() => {
    if (!date || isSameDay(date, state.selectedDate)) return;

    dispatch({ type: 'SELECT_DATE', data: date });
  }, [date]);

  return (
    <div data-table-container>
      <div data-table-header>
        <button
          data-month-control="prev"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          aria-label="Prev month"
        >
          <svg
            data-icon
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
          >
            <path d="M28.05 36 16 23.95 28.05 11.9 30.2 14.05 20.3 23.95 30.2 33.85Z" />
          </svg>
        </button>
        <div
          data-table-title
          role="log"
          aria-live="assertive"
          aria-relevant="text"
          aria-atomic="true"
        >
          {format(state.activeDate, 'MMMM yyyy')}
        </div>
        <button
          data-month-control="next"
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          aria-label="Next month"
        >
          <svg
            data-icon
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
          >
            <path d="M18.75 36 16.6 33.85 26.5 23.95 16.6 14.05 18.75 11.9 30.8 23.95Z" />
          </svg>
        </button>
      </div>
      <table
        tabIndex={0}
        role="grid"
        aria-activedescendant={activeDescendant}
        onKeyDown={onKeyDown}
        data-table
      >
        <caption data-sr-only>Calendar</caption>
        <thead>
          <tr role="row">
            {WEEK_DAYS.map(({ name, abbr }) => (
              <th key={abbr} scope="col" abbr={name} data-table-headercell="">
                {abbr}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((days, rowIndex) => {
            return (
              <tr key={rowIndex.toString()} role="row">
                {days.map((date) => {
                  const id = generateId(date);
                  const isDateActive = isSameDay(date, state.activeDate);
                  const isDateSelected = isSameDay(date, state.selectedDate);
                  const isDateDisabled = !checkIsDateInRange(date, min, max);
                  const title = format(date, 'EEEE, MMMM dd, yyyy');

                  return (
                    <td
                      key={id}
                      id={id}
                      role="gridcell"
                      title={title}
                      aria-label={title}
                      aria-selected={getAttributeValue(isDateSelected)}
                      aria-disabled={getAttributeValue(isDateDisabled)}
                      data-table-datacell=""
                      data-datacell-today={getAttributeValue(isToday(date))}
                      data-outsidemonth={getAttributeValue(
                        !isSameMonth(date, state.activeDate)
                      )}
                      data-datacell-active={getAttributeValue(isDateActive)}
                      data-datacell-selected={getAttributeValue(isDateSelected)}
                      data-datacell-disabled={getAttributeValue(isDateDisabled)}
                      onClick={() => !isDateDisabled && onSelectDate(date)}
                    >
                      <span>
                        {format(date, 'dd')}
                        {tileContent?.(date)}
                      </span>
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
