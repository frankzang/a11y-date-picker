import { getDate, getMonth } from 'date-fns';
import addDays from 'date-fns/addDays';
import addMonths from 'date-fns/addMonths';
import endOfMonth from 'date-fns/endOfMonth';
import format from 'date-fns/format';
import getDay from 'date-fns/getDay';
import isAfter from 'date-fns/isAfter';
import isBefore from 'date-fns/isBefore';
import isEqual from 'date-fns/isEqual';
import isSameDay from 'date-fns/isSameDay';
import isSameMonth from 'date-fns/isSameMonth';
import isToday from 'date-fns/isToday';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subMonths from 'date-fns/subMonths';
import React, { useEffect, useMemo, useRef, useId, useReducer, useLayoutEffect } from 'react';
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
  activeMonth: Date;
  selectedDate: Date;
  activeDescendant?: string;
  isKeyboardInteraction: boolean;
};

type Action =
  | { type: 'SELECT_DATE'; data: Date }
  | { type: 'SET_ACTIVE_DATE'; data: Date }
  | { type: 'INCREMENT_MONTH' }
  | { type: 'DECREMENT_MONTH' }
  | { type: 'SET_ACTIVE_DESCENDANT'; data: string }
  | { type: 'SET_KEYBOARD_INTERACTION'; data: boolean };

const calendarReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SELECT_DATE':
      return {
        ...state,
        selectedDate: action.data,
        activeDate: action.data,
        activeMonth: startOfMonth(action.data),
      };

    case 'SET_ACTIVE_DATE':
      return {
        ...state,
        activeDate: action.data,
        isKeyboardInteraction: true,
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

    case 'SET_KEYBOARD_INTERACTION':
      return { ...state, isKeyboardInteraction: action.data };

    case 'SET_ACTIVE_DESCENDANT':
      return { ...state, activeDescendant: action.data };

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
    activeMonth: date ?? new Date(),
    selectedDate: date ?? new Date(),
    activeDescendant: '',
    isKeyboardInteraction: false,
  });
  const month = useMemo(
    () => getMonthDates(state.activeDate),
    [state.activeDate]
  );
  const weeks = useMemo(() => chunks(month, 7), [month]);
  const isPrevDisabled = min && isBefore(startOfMonth(state.activeDate), min);
  const isNextDisabled =
    max &&
    (isSameMonth(state.activeDate, max) || isAfter(state.activeDate, max));
  const tableRef = useRef<HTMLTableElement>(null);

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

  const activateCell = (row: number, col: number) => {
    const nextCell = tableRef.current?.querySelector<HTMLButtonElement>(
      `[data-row="${row}"][data-col="${col}"]`
    );
    if (!nextCell) return;

    const newActiveDate = weeks[row][col];

    dispatch({ type: 'SET_ACTIVE_DATE', data: newActiveDate });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const currentCell = e.currentTarget!;
    const { row, col, state } = currentCell?.dataset;
    const rowNumber = Number(row);
    const colNumber = Number(col);
    const isDisabled = state === 'disabled';
    const cellDate = weeks[rowNumber][colNumber];

    switch (e.key) {
      case 'ArrowUp': {
        activateCell(rowNumber - 1, colNumber);
        break;
      }
      case 'ArrowDown': {
        activateCell(rowNumber + 1, colNumber);
        break;
      }
      case 'ArrowLeft': {
        activateCell(rowNumber, colNumber - 1);
        break;
      }
      case 'ArrowRight': {
        activateCell(rowNumber, colNumber + 1);
        break;
      }
      case 'Home': {
        e.ctrlKey ? activateCell(0, 0) : activateCell(rowNumber, 0);
        break;
      }
      case 'End': {
        e.ctrlKey ? activateCell(5, 6) : activateCell(rowNumber, 6);
        break;
      }
      case ' ':
      case 'Enter':
        !isDisabled && onSelectDate(cellDate);
      default:
        break;
    }
  };

  // Keep the date from the props in sync with the date on state
  useEffect(() => {
    if (!date || isSameDay(date, state.selectedDate)) return;

    dispatch({ type: 'SELECT_DATE', data: date });
  }, [date]);

  // Set initial active descendant based on the active date
  useEffect(() => {
    const initialActiveDescendant = tableRef.current?.querySelector(
      `#${getId(state.activeDate)}`
    )!;

    dispatch({
      type: 'SET_ACTIVE_DESCENDANT',
      data: initialActiveDescendant?.id,
    });
  }, []);

  // Set the focusable day of the month on month change, in case the active date is not present
  useEffect(() => {
    tableRef.current
      ?.querySelector<HTMLElement>(`#${getId(state.activeDate)}`)
      ?.setAttribute('tabindex', '0');
  }, [state.activeDate]);

  // Manage focus of the active date, only if it's keyboard interaction
  useLayoutEffect(() => {
    if (!state.isKeyboardInteraction) return;

    let dateToFocus = tableRef.current?.querySelector<HTMLElement>(
      `#${getId(state.activeDate)}`
    );

    dateToFocus?.focus();

    dispatch({ type: 'SET_ACTIVE_DESCENDANT', data: dateToFocus?.id! });
    dispatch({ type: 'SET_KEYBOARD_INTERACTION', data: false });
  }, [state.activeDate, state.isKeyboardInteraction]);

  return (
    <div>
      <div
        role="log"
        aria-live="polite"
        aria-relevant="text"
        aria-atomic="true"
      >
        {format(state.activeDate, 'MMMM yyyy')}
      </div>
      <div>
        <button
          onClick={prevMonth}
          disabled={isPrevDisabled}
          aria-label="Prev month"
        >
          Prev
        </button>
        <button
          onClick={nextMonth}
          disabled={isNextDisabled}
          aria-label="Next month"
        >
          Next
        </button>
      </div>
      <table
        role="grid"
        ref={tableRef}
        aria-activedescendant={state.activeDescendant}
      >
        <caption>Calendar</caption>
        <thead>
          <tr role="row">
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
              <tr key={row.toString()} role="row">
                {days.map((date, col) => {
                  const id = getId(date);
                  const isDateActive = isSameDay(date, state.activeDate);
                  const isDateSelected = isSameDay(date, state.selectedDate);
                  const isDateDisabled =
                    (min && isBefore(date, min)) ||
                    (max && (isEqual(date, max) || isAfter(date, max)));
                  const title = format(date, 'EEEE, MMMM dd, yyyy');
                  const cellState = isDateSelected
                    ? 'selected'
                    : isDateActive
                    ? 'active'
                    : isDateDisabled
                    ? 'disabled'
                    : 'idle';

                  return (
                    <td
                      key={id}
                      id={id}
                      role="gridcell"
                      tabIndex={isDateActive ? 0 : -1}
                      aria-selected={isDateSelected}
                      aria-disabled={isDateDisabled}
                      data-row={row}
                      data-col={col}
                      data-today={isToday(date) ? '' : null}
                      data-state={cellState}
                      onClick={() => !isDateDisabled && onSelectDate(date)}
                      onKeyDown={onKeyDown}
                    >
                      <span
                        title={title}
                        aria-label={title}
                      >
                        {format(date, 'dd')} {tileContent?.(date)}
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
