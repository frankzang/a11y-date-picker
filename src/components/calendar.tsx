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
] as const;

export const generateDates = (date: Date, length?: number) => {
  const start = startOfWeek(startOfMonth(date));

  return [...Array(length ?? 42).keys()].map((n) => addDays(start, n));
};

const generateId = (date: Date) => `_${getDate(date)}_${getMonth(date)}_`;

const isSameDayOrAfter = (date: Date, date2: Date) =>
  isSameDay(date, date2) || isAfter(date, date2);

const isSameDayOrBefore = (date: Date, date2: Date) =>
  isSameDay(date, date2) || isBefore(date, date2);

const isDateInRange = (date: Date, { start, end }: any) =>
  isSameDayOrAfter(date, start) && isSameDayOrBefore(date, end);

const checkIsDateInRange = (date: Date, start?: Date, end?: Date) => {
  if (start && end) return isDateInRange(date, { start, end });

  if (start) return isSameDayOrAfter(date, start);

  if (end) return isSameDayOrBefore(date, end);

  return true;
};

const safeIsSameDay = (date?: Date, dateToCompare?: Date) =>
  !!(date && dateToCompare && isSameDay(date, dateToCompare));

const getAttributeValue = (condition: boolean) =>
  condition ? true : undefined;

type State = {
  activeDate: Date;
  selectedDate?: Date;
  visibleDates: Date[];
};

type Action =
  | { type: 'SELECT_DATE'; data: Date }
  | { type: 'SET_ACTIVE_DATE'; data: Date };

const calendarReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_ACTIVE_DATE':
      return {
        ...state,
        activeDate: action.data,
        visibleDates: generateDates(action.data),
      };

    case 'SELECT_DATE':
      return {
        ...state,
        activeDate: action.data,
        selectedDate: action.data,
        visibleDates: generateDates(action.data),
      };

    default:
      throw new Error('Invalid action passed to calendarReducer');
  }
};

type CalendarProps = {
  date?: Date;
  min?: Date;
  max?: Date;
  name?: string;
  onSelect?(date: Date): void;
  tileContent?: (date: Date) => string;
  disabledTile?(date: Date): boolean;
};
export const Calendar = ({
  date,
  min,
  max,
  name,
  tileContent,
  onSelect,
  disabledTile,
}: CalendarProps) => {
  const [state, dispatch] = useReducer(
    calendarReducer,
    {
      activeDate: date || new Date(),
      selectedDate: date,
      visibleDates: [],
    },
    (state): State => ({
      ...state,
      visibleDates: generateDates(state.activeDate),
    })
  );
  const minDate = min ? startOfDay(min) : undefined;
  const maxDate = max ? startOfDay(max) : undefined;
  const weeks = useMemo(
    () => chunks(state.visibleDates, 7),
    [state.visibleDates]
  );
  const isPrevDisabled =
    min && isBefore(endOfMonth(subMonths(state.activeDate, 1)), min);
  const isNextDisabled =
    max && isAfter(startOfMonth(addMonths(state.activeDate, 1)), max);
  const activeDescendant = generateId(state.activeDate);

  const checkIsDateDisabled = (date: Date) =>
    !checkIsDateInRange(date, min, max) || (disabledTile?.(date) ?? false);

  const handlePrevMonth = () => {
    const prevMonthDate = subMonths(state.activeDate, 1);

    if (!minDate) {
      dispatch({ type: 'SET_ACTIVE_DATE', data: prevMonthDate });

      return;
    }

    const activeDate = isSameDayOrAfter(prevMonthDate, minDate)
      ? prevMonthDate
      : minDate;

    dispatch({ type: 'SET_ACTIVE_DATE', data: activeDate });
  };

  const handleNextMonth = () => {
    const nextMonthDate = addMonths(state.activeDate, 1);

    if (!maxDate) {
      dispatch({ type: 'SET_ACTIVE_DATE', data: nextMonthDate });

      return;
    }

    const firstNextMonthsDay = startOfMonth(nextMonthDate);
    // checks if next active date is before or equal the max available date
    // if it's not, try the first day of the next month, and if this date
    // is unavailable as well, keeps the current active date
    const activeDate = isSameDayOrBefore(nextMonthDate, maxDate)
      ? nextMonthDate
      : isSameDayOrBefore(firstNextMonthsDay, maxDate)
      ? firstNextMonthsDay
      : state.activeDate;

    dispatch({ type: 'SET_ACTIVE_DATE', data: activeDate });
  };

  const onSelectDate = (date: Date) => {
    if (safeIsSameDay(date, state.selectedDate)) return;

    if (checkIsDateDisabled(date)) return;

    dispatch({ type: 'SELECT_DATE', data: date });
    onSelect?.(date);
  };

  const onActivateDate = (date: Date) => {
    const isDateInRange = checkIsDateInRange(date, minDate, maxDate);
    if (!isDateInRange) return;

    dispatch({ type: 'SET_ACTIVE_DATE', data: date });
  };

  const onKeyDown = (evt: React.KeyboardEvent<HTMLTableElement>) => {
    const keyboardEventHandlers: Record<string, (() => void) | undefined> = {
      ArrowUp: () => onActivateDate(subDays(state.activeDate, 7)),
      ArrowDown: () => onActivateDate(addDays(state.activeDate, 7)),
      ArrowLeft: () => onActivateDate(subDays(state.activeDate, 1)),
      ArrowRight: () => onActivateDate(addDays(state.activeDate, 1)),
      Home: () => {
        const firstAvailableDay = state.visibleDates.find(
          (date) =>
            isSameMonth(date, state.activeDate) &&
            checkIsDateInRange(date, minDate, maxDate)
        );

        if (!firstAvailableDay) return;

        onActivateDate(firstAvailableDay);
      },
      End: () => {
        const lastAvailableDay = state.visibleDates
          .reverse()
          .find(
            (date) =>
              isSameMonth(date, state.activeDate) &&
              checkIsDateInRange(date, minDate, maxDate)
          )!;

        if (!lastAvailableDay) return;

        onActivateDate(lastAvailableDay);
      },
      Enter: () => onSelectDate(state.activeDate),
    };

    const keyHandler = keyboardEventHandlers[evt.key];
    if (!keyHandler) return;

    evt.preventDefault();
    keyHandler();
  };

  // Keep the date from the props in sync with the date on state
  useEffect(() => {
    if (!date || safeIsSameDay(date, state.selectedDate)) return;

    dispatch({ type: 'SELECT_DATE', data: date });
  }, [date]);

  return (
    <div data-table-container>
      <div data-table-header>
        <button
          type="button"
          data-month-control="prev"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          aria-label="Previous month"
        >
          <svg
            data-icon
            xmlns="http://www.w3.org/2000/svg"
            height="48"
            width="48"
            aria-hidden="true"
          >
            <path d="M28.05 36 16 23.95 28.05 11.9 30.2 14.05 20.3 23.95 30.2 33.85Z" />
          </svg>
        </button>
        <div
          data-table-title=""
          role="log"
          aria-live="assertive"
          aria-relevant="text"
          aria-atomic="true"
        >
          {format(state.activeDate, 'MMMM yyyy')}
        </div>
        <button
          type="button"
          data-month-control="next"
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          aria-label="Next month"
        >
          <svg
            data-icon
            aria-hidden="true"
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
          <tr role="row" data-table-row="">
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
              <tr key={rowIndex.toString()} role="row" data-table-row="">
                {days.map((date) => {
                  const id = generateId(date);
                  const isDateActive = isSameDay(date, state.activeDate);
                  const isDateSelected = safeIsSameDay(
                    date,
                    state.selectedDate
                  );
                  const isDateDisabled = checkIsDateDisabled(date);
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
                      onClick={() => onSelectDate(date)}
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
      {name ? (
        <input
          type="hidden"
          name={name}
          value={state.selectedDate?.toString()}
        />
      ) : null}
    </div>
  );
};
