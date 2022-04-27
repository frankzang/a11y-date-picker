import { getDate, getMonth } from 'date-fns';
import addDays from 'date-fns/addDays';
import addMonths from 'date-fns/addMonths';
import { endOfMonth, subDays } from 'date-fns/esm';
import format from 'date-fns/format';
import isAfter from 'date-fns/isAfter';
import isBefore from 'date-fns/isBefore';
import isSameDay from 'date-fns/isSameDay';
import isSameMonth from 'date-fns/isSameMonth';
import isToday from 'date-fns/isToday';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import React, { useEffect, useMemo, useReducer } from 'react';
import { chunks } from '../utils/array';
import './index.css';

const WEEK_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const getMonthDates = (date: Date) => {
  const start = startOfWeek(startOfMonth(date));
  const dates = [...Array(42).keys()].map((n) => addDays(start, n));

  return dates;
};

const getId = (date: Date) => `_${getDate(date)}_${getMonth(date)}_`;

type State = {
  activeDate: Date;
  selectedDate: Date;
};

type Action =
  | { type: 'SELECT_DATE'; data: Date }
  | { type: 'SET_ACTIVE_DATE'; data: Date }
  | { type: 'INCREMENT_MONTH' }
  | { type: 'DECREMENT_MONTH' };

const calendarReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SELECT_DATE':
      return {
        ...state,
        selectedDate: action.data,
        activeDate: action.data,
      };

    case 'SET_ACTIVE_DATE':
      return {
        ...state,
        activeDate: action.data,
      };

    case 'INCREMENT_MONTH':
      return {
        ...state,
        activeDate: addMonths(state.activeDate, 1),
      };

    case 'DECREMENT_MONTH':
      return {
        ...state,
        activeDate: subMonths(state.activeDate, 1),
      };

    default:
      throw new Error('Invalid action passed to calendarReducer');
  }
};

type CalendarProps = {
  date?: Date;
  min?: Date;
  max?: Date;
  tileContent?: (date: Date) => string;
  onClick?(date: Date): void;
};
export const Calendar = ({
  date,
  min,
  max,
  tileContent,
  onClick,
}: CalendarProps) => {
  const [state, dispatch] = useReducer(calendarReducer, {
    activeDate: date ?? new Date(),
    selectedDate: date ?? new Date(),
  });
  const month = useMemo(
    () => getMonthDates(state.activeDate),
    [state.activeDate]
  );
  const weeks = useMemo(() => chunks(month, 7), [month]);
  const isPrevDisabled =
    min && (isBefore(month.at(0)!, min) || isSameMonth(month.at(0)!, min));
  const isNextDisabled =
    max && (isAfter(month.at(-1)!, max) || isSameMonth(month.at(-1)!, max));
  const activeDescendant = getId(state.activeDate);

  const prevMonth = () => {
    dispatch({ type: 'DECREMENT_MONTH' });
  };

  const nextMonth = () => {
    dispatch({ type: 'INCREMENT_MONTH' });
  };

  const onSelectDate = (date: Date) => {
    dispatch({ type: 'SELECT_DATE', data: date });
    onClick?.(date);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTableElement>) => {
    e.preventDefault();
    const currentActiveCell =
      e.currentTarget.querySelector<HTMLTableCellElement>(
        `#${getId(state.activeDate)}`
      )!;
    const isDisabled = currentActiveCell.hasAttribute('data-disabled');

    switch (e.key) {
      case 'ArrowUp': {
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: subDays(state.activeDate, 7),
        });
        break;
      }
      case 'ArrowDown': {
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: addDays(state.activeDate, 7),
        });
        break;
      }
      case 'ArrowLeft': {
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: subDays(state.activeDate, 1),
        });
        break;
      }
      case 'ArrowRight': {
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: addDays(state.activeDate, 1),
        });
        break;
      }
      case 'Home': {
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: startOfMonth(state.activeDate),
        });
        break;
      }
      case 'End': {
        dispatch({
          type: 'SET_ACTIVE_DATE',
          data: endOfMonth(state.activeDate),
        });
        break;
      }
      case ' ':
      case 'Enter':
        !isDisabled && onSelectDate(state.activeDate);
      default:
        break;
    }
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
          onClick={prevMonth}
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
          aria-live="polite"
          aria-relevant="text"
          aria-atomic="true"
        >
          {format(state.activeDate, 'MMMM yyyy')}
        </div>
        <button
          data-month-control="next"
          onClick={nextMonth}
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
            {WEEK_DAYS.map((day) => (
              <th key={day} scope="col" data-table-headercell>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((days, rowIndex) => {
            return (
              <tr key={rowIndex.toString()} role="row">
                {days.map((date) => {
                  const id = getId(date);
                  const isDateActive = isSameDay(date, state.activeDate);
                  const isDateSelected = isSameDay(date, state.selectedDate);
                  const isDateDisabled =
                    (min && isBefore(date, min)) || (max && isAfter(date, max));
                  const title = format(date, 'EEEE, MMMM dd, yyyy');
                  const cellState = isDateSelected
                    ? 'selected'
                    : isDateActive
                    ? 'active'
                    : 'idle';

                  return (
                    <td
                      key={id}
                      id={id}
                      role="gridcell"
                      aria-selected={isDateSelected}
                      aria-disabled={isDateDisabled}
                      data-table-datacell
                      data-today={isToday(date) ? '' : null}
                      data-outsidemonth={
                        !isSameMonth(date, state.activeDate) ? '' : null
                      }
                      data-state={cellState}
                      data-disabled={isDateDisabled ? '' : null}
                      onClick={() => !isDateDisabled && onSelectDate(date)}
                    >
                      <span title={title} aria-label={title}>
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
