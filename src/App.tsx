import { addDays, startOfMonth } from 'date-fns';
import { addMonths, subDays } from 'date-fns/esm';
import { useState } from 'react';
import { Calendar } from './components/calendar';

function App() {
  const [date, setDate] = useState(new Date());
  const startAt = subDays(startOfMonth(new Date()), 5);
  const endAt = addMonths(startAt, 3);

  return (
    <div className="App">
      <Calendar date={date} min={startAt} max={endAt} onSelect={setDate} disabledDate={date => date.getDay() === 3} />
    </div>
  );
}

export default App;
