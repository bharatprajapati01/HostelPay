import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

export default function MonthPicker({ year, month, onChange }) {
  const currentDate = new Date(year, month);

  const goBack = () => {
    const prev = subMonths(currentDate, 1);
    onChange(prev.getFullYear(), prev.getMonth());
  };

  const goForward = () => {
    const next = addMonths(currentDate, 1);
    onChange(next.getFullYear(), next.getMonth());
  };

  const label = format(currentDate, 'MMMM yyyy');

  return (
    <div className="month-picker">
      <button className="month-picker-btn" onClick={goBack} title="Previous month">
        <ChevronLeft size={18} />
      </button>
      <span className="month-picker-label">{label}</span>
      <button className="month-picker-btn" onClick={goForward} title="Next month">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
