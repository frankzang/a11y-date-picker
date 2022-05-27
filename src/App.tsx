import { startOfMonth } from 'date-fns';
import { addMonths, subDays } from 'date-fns/esm';
import { useState } from 'react';
import { Calendar } from './components/calendar';

function App() {
  const [_date, setDate] = useState(new Date());
  const startAt = subDays(startOfMonth(new Date()), 5);
  const endAt = addMonths(startAt, 3);

  return (
    <div className="App">
      <Calendar
        min={startAt}
        max={endAt}
        onSelect={setDate}
        disabledTile={(date) => date.getDay() === 0}
        name="selectedDate"
      />
    </div>
  );
}

export default App;
