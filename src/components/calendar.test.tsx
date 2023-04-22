import { Calendar, generateDates } from './calendar';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  format,
  isSameDay,
  setDate,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { vi } from 'vitest';

const dateFormatter = (date: Date) => format(date, 'EEEE, MMMM dd, yyyy');

const defaultDate = new Date(1995, 5, 18);

vi.useFakeTimers();
vi.setSystemTime(defaultDate);

describe('Calendar', () => {
  describe('aria', () => {
    test('it has aria-selected on the selected date', () => {
      const date = addYears(defaultDate, 1);
      render(<Calendar date={date} />);

      const activeCell = screen.getByRole('gridcell', {
        name: new RegExp(format(date, 'EEEE, MMMM dd, yyyy'), 'i'),
      });

      fireEvent.click(activeCell);

      expect(activeCell).toHaveAttribute('aria-selected', 'true');
    });

    test('it has aria-disabled on a disabled date', () => {
      const date = addYears(defaultDate, 1);
      const tomorrow = addDays(date, 1);

      render(
        <Calendar
          date={date}
          disabledTile={(cellData) => isSameDay(cellData, tomorrow)}
        />
      );

      const activeCell = screen.getByRole('gridcell', {
        name: new RegExp(format(date, 'EEEE, MMMM dd, yyyy'), 'i'),
      });
      const disabledCell = screen.getByRole('gridcell', {
        name: new RegExp(format(tomorrow, 'EEEE, MMMM dd, yyyy'), 'i'),
      });

      expect(activeCell).not.toHaveAttribute('aria-disabled');
      expect(disabledCell).toHaveAttribute('aria-disabled');
    });
  });

  describe('rendering', () => {
    test('it has data-datacell-selected on the selected date', () => {
      const date = addYears(defaultDate, 1);
      render(<Calendar date={date} />);

      const activeCell = screen.getByRole('gridcell', {
        name: new RegExp(format(date, 'EEEE, MMMM dd, yyyy'), 'i'),
      });

      expect(activeCell).toHaveAttribute('data-datacell-selected');
    });

    test('it has data-datacell-active on today by default', () => {
      const today = new Date();
      render(<Calendar />);

      const activeCell = screen.getByRole('gridcell', {
        name: new RegExp(dateFormatter(today), 'i'),
      });

      expect(activeCell).toHaveAttribute('data-datacell-active');
    });

    test('it has data-datacell-disabled on days specified by "disabledTile" callback', () => {
      const disabledDates = generateDates(defaultDate, 5);
      render(
        <Calendar
          disabledTile={(date) => disabledDates.some((d) => isSameDay(d, date))}
        />
      );

      disabledDates.forEach((disabledDate) =>
        expect(
          screen.getByRole('gridcell', {
            name: new RegExp(dateFormatter(disabledDate), 'i'),
          })
        ).toHaveAttribute('data-datacell-disabled')
      );
    });

    test('it can submit a value if a name is provided and used inside a form', () => {
      let submitedValue = null;
      const TestComponent = () => (
        <form
          onSubmit={(e) => {
            const inp = e.currentTarget.elements.namedItem(
              'selectedDate'
            ) as HTMLInputElement;

            submitedValue = inp.value;
          }}
        >
          <Calendar name="selectedDate" date={defaultDate} />
        </form>
      );

      const { container } = render(<TestComponent />);

      fireEvent.submit(container.querySelector('form')!);

      expect(submitedValue).toBe(defaultDate.toString());
    });
  });

  describe('user events', () => {
    describe('when clicking an available day', () => {
      test('it selects the day', () => {
        render(<Calendar />);

        const threeDaysFromNow = addDays(new Date(), 3);
        const cellName = new RegExp(dateFormatter(threeDaysFromNow), 'i');
        const cell = screen.getByRole('gridcell', {
          name: cellName,
        });

        fireEvent.click(cell);

        expect(cell).toHaveAttribute('data-datacell-selected');
      });

      test('it calls "onSelect" with new date', () => {
        const mockOnSelect = vi.fn();
        render(<Calendar onSelect={mockOnSelect} />);

        const threeDaysFromNow = startOfDay(addDays(new Date(), 3));
        const cellName = new RegExp(dateFormatter(threeDaysFromNow), 'i');
        const cell = screen.getByRole('gridcell', {
          name: cellName,
        });

        fireEvent.click(cell);

        expect(mockOnSelect).toHaveBeenCalledWith(threeDaysFromNow);
      });
    });

    describe('when clicking a disabled day', () => {
      test('it will *not* select the day', () => {
        render(<Calendar disabledTile={() => true} />);

        const threeDaysFromNow = addDays(new Date(), 3);
        const cellName = new RegExp(dateFormatter(threeDaysFromNow), 'i');
        const cell = screen.getByRole('gridcell', {
          name: cellName,
        });

        fireEvent.click(cell);

        expect(cell).not.toHaveAttribute('data-datacell-selected');
      });

      test('it will *not* call "onSelect"', () => {
        const mockOnSelect = vi.fn();
        render(<Calendar onSelect={mockOnSelect} disabledTile={() => true} />);

        const threeDaysFromNow = startOfDay(addDays(new Date(), 3));
        const cellName = new RegExp(dateFormatter(threeDaysFromNow), 'i');
        const cell = screen.getByRole('gridcell', {
          name: cellName,
        });

        fireEvent.click(cell);

        expect(mockOnSelect).not.toHaveBeenCalledWith(threeDaysFromNow);
      });
    });

    describe('when navigating between dates with keyboard', () => {
      test('it should focus the upper date on "ArrowUp" press', () => {
        const upperDate = subDays(defaultDate, 7);
        render(<Calendar date={defaultDate} />);

        const table = screen.getByRole('grid');

        fireEvent.keyDown(table, { code: 'ArrowUp' });

        const cell = screen.getByRole('gridcell', {
          name: dateFormatter(upperDate),
        });

        expect(cell).toHaveAttribute('data-datacell-active');
        expect(table).toHaveAttribute('aria-activedescendant', cell.id);
      });

      test('it should focus the date to the left on "ArrowLeft" press', () => {
        const leftDate = subDays(defaultDate, 1);
        render(<Calendar date={defaultDate} />);

        const table = screen.getByRole('grid');

        fireEvent.keyDown(table, { code: 'ArrowLeft' });

        const cell = screen.getByRole('gridcell', {
          name: dateFormatter(leftDate),
        });

        expect(cell).toHaveAttribute('data-datacell-active');
        expect(table).toHaveAttribute('aria-activedescendant', cell.id);
      });

      test('it should focus the date to the right on "ArrowRight" press', () => {
        const rigthDate = addDays(defaultDate, 1);
        render(<Calendar date={defaultDate} />);

        const table = screen.getByRole('grid');

        fireEvent.keyDown(table, { code: 'ArrowRight' });

        const cell = screen.getByRole('gridcell', {
          name: dateFormatter(rigthDate),
        });

        expect(cell).toHaveAttribute('data-datacell-active');
        expect(table).toHaveAttribute('aria-activedescendant', cell.id);
      });

      test('it should focus the date to the bottom on "ArrowDown" press', () => {
        const bottomDate = addDays(defaultDate, 7);
        render(<Calendar date={defaultDate} />);

        const table = screen.getByRole('grid');

        fireEvent.keyDown(table, { code: 'ArrowDown' });

        const cell = screen.getByRole('gridcell', {
          name: dateFormatter(bottomDate),
        });

        expect(cell).toHaveAttribute('data-datacell-active');
        expect(table).toHaveAttribute('aria-activedescendant', cell.id);
      });

      test('it should focus the first day of month on "Home" press', () => {
        const firstMonthDay = startOfMonth(defaultDate);
        render(<Calendar date={defaultDate} />);

        const table = screen.getByRole('grid');

        fireEvent.keyDown(table, { code: 'Home' });

        const cell = screen.getByRole('gridcell', {
          name: dateFormatter(firstMonthDay),
        });

        expect(cell).toHaveAttribute('data-datacell-active');
        expect(table).toHaveAttribute('aria-activedescendant', cell.id);
      });

      test('it should focus the last day of month on "End" press', () => {
        const lastMonthDay = endOfMonth(defaultDate);
        render(<Calendar date={defaultDate} />);

        const table = screen.getByRole('grid');

        fireEvent.keyDown(table, { code: 'End' });

        const cell = screen.getByRole('gridcell', {
          name: dateFormatter(lastMonthDay),
        });

        expect(cell).toHaveAttribute('data-datacell-active');
        expect(table).toHaveAttribute('aria-activedescendant', cell.id);
      });

      describe('on "Enter" press on an available day', () => {
        test('it selects the day', () => {
          render(<Calendar />);

          const table = screen.getByRole('grid');
          const cell = screen.getByRole('gridcell', {
            name: dateFormatter(defaultDate),
          });

          expect(cell).not.toHaveAttribute('data-datacell-selected');

          fireEvent.keyDown(table, { code: 'Enter' });

          expect(cell).toHaveAttribute('data-datacell-selected');
        });

        test('it calls "onSelect" with new date', () => {
          const mockOnSelect = vi.fn();
          render(<Calendar onSelect={mockOnSelect} />);

          const table = screen.getByRole('grid');
          const cell = screen.getByRole('gridcell', {
            name: dateFormatter(defaultDate),
          });

          expect(cell).not.toHaveAttribute('data-datacell-selected');

          fireEvent.keyDown(table, { code: 'Enter' });

          expect(mockOnSelect).toHaveBeenCalledWith(defaultDate);
        });
      });

      describe('on "Enter" press on a disabled day', () => {
        test('it will *not* select the day', () => {
          render(<Calendar disabledTile={() => true} />);

          const table = screen.getByRole('grid');
          const cell = screen.getByRole('gridcell', {
            name: dateFormatter(defaultDate),
          });

          fireEvent.keyDown(table, { code: 'Enter' });

          expect(cell).not.toHaveAttribute('data-datacell-selected');
        });

        test('it will *not* call "onSelect"', () => {
          const mockOnSelect = vi.fn();
          render(
            <Calendar onSelect={mockOnSelect} disabledTile={() => true} />
          );

          const table = screen.getByRole('grid');

          fireEvent.keyDown(table, { code: 'Enter' });

          expect(mockOnSelect).not.toHaveBeenCalledWith(defaultDate);
        });
      });
    });

    describe('when clicking previous month', () => {
      test('it goes to previous month', () => {
        render(<Calendar />);

        const initialTitle = /june 1995/i;
        const nextTitle = /may 1995/i;

        expect(screen.getByRole('log')).toHaveTextContent(initialTitle);

        fireEvent.click(
          screen.getByRole('button', { name: /previous month/i })
        );

        expect(screen.getByRole('log')).toHaveTextContent(nextTitle);
        expect(
          screen.getByRole('gridcell', {
            name: dateFormatter(subMonths(defaultDate, 1)),
          })
        ).toHaveAttribute('data-datacell-active');
      });

      test('it can *not* go to previous month if previous month is before min date', () => {
        render(<Calendar min={startOfMonth(defaultDate)} />);

        const initialTitle = /june 1995/i;

        expect(screen.getByRole('log')).toHaveTextContent(initialTitle);

        const prevBtn = screen.getByRole('button', {
          name: /previous month/i,
        });
        expect(prevBtn).toBeDisabled();

        fireEvent.click(prevBtn);

        expect(screen.getByRole('log')).toHaveTextContent(initialTitle);
      });

      describe('when next active date is before min date on previous month', () => {
        test('it activates the min date of the previous month', () => {
          const minDate = subMonths(setDate(defaultDate, 15), 1);
          render(<Calendar min={minDate} date={startOfMonth(defaultDate)} />);

          fireEvent.click(
            screen.getByRole('button', { name: /previous month/i })
          );

          expect(
            screen.getByRole('gridcell', {
              name: dateFormatter(minDate),
            })
          ).toHaveAttribute('data-datacell-active');
        });
      });
    });

    describe('when clicking next month', () => {
      test('it goes to next month', () => {
        render(<Calendar />);

        const initialTitle = /june 1995/i;
        const nextTitle = /july 1995/i;

        expect(screen.getByRole('log')).toHaveTextContent(initialTitle);

        fireEvent.click(screen.getByRole('button', { name: /next month/i }));

        expect(screen.getByRole('log')).toHaveTextContent(nextTitle);
        expect(
          screen.getByRole('gridcell', {
            name: dateFormatter(addMonths(defaultDate, 1)),
          })
        ).toHaveAttribute('data-datacell-active');
      });

      test('it can *not* go to next month if next month is after max date', () => {
        render(<Calendar max={endOfMonth(defaultDate)} />);

        const initialTitle = /june 1995/i;

        expect(screen.getByRole('log')).toHaveTextContent(initialTitle);

        const nextBtn = screen.getByRole('button', { name: /next month/i });
        expect(nextBtn).toBeDisabled();

        fireEvent.click(nextBtn);

        expect(screen.getByRole('log')).toHaveTextContent(initialTitle);
      });

      describe('when next active date is after max date on next month', () => {
        test('it activates the first day of the next month', () => {
          const maxDate = addMonths(setDate(defaultDate, 15), 1);
          const startOfNextMonth = startOfMonth(maxDate);
          render(<Calendar max={maxDate} date={startOfMonth(defaultDate)} />);

          fireEvent.click(screen.getByRole('button', { name: /next month/i }));

          expect(
            screen.getByRole('gridcell', {
              name: dateFormatter(startOfNextMonth),
            })
          ).toHaveAttribute('data-datacell-active');
        });
      });
    });
  });
});
