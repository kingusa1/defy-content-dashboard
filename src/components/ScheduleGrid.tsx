import React from 'react';
import { Clock } from 'lucide-react';
import type { ScheduleEntry } from '../types/content';

interface ScheduleGridProps {
  schedule: ScheduleEntry[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule }) => {
  const today = new Date().getDay();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-[#1b1e4c]">Posting Schedule</h3>
        <p className="text-sm text-slate-500">Weekly content posting times by agent</p>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50">
                Agent
              </th>
              {DAYS.map((day, index) => (
                <th
                  key={day}
                  className={`px-4 py-3 text-center text-xs font-semibold uppercase min-w-[100px] ${
                    index === today
                      ? 'bg-[#13BCC5]/10 text-[#13BCC5]'
                      : 'text-slate-500'
                  }`}
                >
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedule.map((entry, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-white">
                  <span className="font-medium text-[#1b1e4c] text-sm">{entry.agentName}</span>
                </td>
                {DAY_KEYS.map((dayKey, dayIndex) => {
                  const time = entry[dayKey];
                  const isToday = dayIndex === today;
                  return (
                    <td
                      key={dayKey}
                      className={`px-4 py-3 text-center ${isToday ? 'bg-[#13BCC5]/5' : ''}`}
                    >
                      {time ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          isToday
                            ? 'bg-[#13BCC5] text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Clock size={12} />
                          {time}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {schedule.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No schedule data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGrid;
