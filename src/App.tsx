import { addDays, startOfMonth } from 'date-fns';
import { addMonths } from 'date-fns/esm';
import { useState } from 'react';
import { Calendar } from './components/calendar';

function App() {
  const [date, setDate] = useState(new Date());
  const startAt = startOfMonth(new Date());
  const endAt = addMonths(startAt, 3);

  return (
    <div className="App">
      <Calendar date={date} min={startAt} max={endAt} onClick={setDate} />
    </div>
  );
}

export default App;
