import { addDays } from 'date-fns';
import { addMonths } from 'date-fns/esm';
import { useState } from 'react';
import { Calendar } from './components/calendar';

function App() {
  const [date, setDate] = useState(new Date());
  const startAt = new Date();
  const endAt = addMonths(startAt, 3);

  return (
    <div className="App">
      <button
        onClick={() =>
          setDate((d) => {
            return addDays(d, 1);
          })
        }
      >
        set date
      </button>
      <Calendar date={date} min={startAt} max={endAt} onClick={setDate} />
    </div>
  );
}

export default App;
