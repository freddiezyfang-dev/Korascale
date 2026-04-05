'use client';

import React, { useMemo, useState } from 'react';
import { Journey } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const THEME_GREEN = '#2D4033';

/** 同一天（仅比较年月日） */
function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface DateSlot {
  startDate: Date;
  endDate: Date;
  price: number;
}

interface BookingCalendarGridProps {
  journey: Journey;
  onBookingClick?: (date: Date, pricePerPerson: number) => void;
}

export default function BookingCalendarGrid({ journey, onBookingClick }: BookingCalendarGridProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState<{ startDate: Date; price: number } | null>(null);

  /** 未在列表中或未显式标记为关闭的日期视为可订（默认全开） */
  const disabledDaySet = useMemo(() => {
    if (!journey.availableDates?.length) return new Set<string>();
    const set = new Set<string>();
    for (const item of journey.availableDates) {
      if ((item as { enabled?: boolean }).enabled === false) {
        const start = new Date(item.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(item.endDate);
        end.setHours(23, 59, 59, 999);
        for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
          set.add(new Date(t).toISOString().split('T')[0]);
        }
      }
    }
    return set;
  }, [journey.availableDates]);

  /** 与后台剔除式管理一致：从 today 起按天生成 365 天，排除 disabledDaySet 中的日期 */
  const dateSlots = useMemo((): DateSlot[] => {
    const basePrice = journey.price || 0;
    const list: DateSlot[] = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const ymd = d.toISOString().split('T')[0];
      if (disabledDaySet.has(ymd)) continue;
      list.push({
        startDate: new Date(d.getTime()),
        endDate: new Date(d.getTime()),
        price: basePrice,
      });
    }
    return list;
  }, [journey.price, today, disabledDaySet]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const gridDays: { date: Date | null; slot: DateSlot | null }[] = [];
  for (let i = 0; i < firstWeekday; i++) gridDays.push({ date: null, slot: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const slot = dateSlots.find((s) => isSameCalendarDay(date, s.startDate)) ?? null;
    gridDays.push({ date, slot });
  }

  const goPrev = () => {
    setViewMonth((m) => {
      const next = new Date(m);
      next.setMonth(next.getMonth() - 1, 1);
      return next;
    });
    setSelectedSlot(null);
  };
  const goNext = () => {
    setViewMonth((m) => {
      const next = new Date(m);
      next.setMonth(next.getMonth() + 1, 1);
      return next;
    });
    setSelectedSlot(null);
  };

  /** 仅当日期属于 enabled: true 的 dateSlot 且非过去日期时触发；preventDefault/stopPropagation 防止父容器拦截 */
  const handleDayClick = (e: React.MouseEvent, slot: DateSlot) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSlot({ startDate: slot.startDate, price: slot.price });
  };

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full flex flex-col">
      <h3 className="text-2xl font-heading mb-4 text-gray-900">Select Your Date</h3>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goPrev}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-medium text-gray-900">{monthLabel}</span>
          <button
            type="button"
            onClick={goNext}
            className="p-2 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((w) => (
            <div
              key={w}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {w}
            </div>
          ))}
          {gridDays.map((cell, i) => {
            if (!cell.date) {
              return <div key={`e-${i}`} className="aspect-square" />;
            }
            const dayStart = new Date(cell.date);
            dayStart.setHours(0, 0, 0, 0);
            const isPast = dayStart.getTime() < today.getTime();
            const ymd = dayStart.toISOString().split('T')[0];
            const isExplicitlyDisabled = disabledDaySet.has(ymd);
            const isClickable = !isPast && !isExplicitlyDisabled;
            const activeSlot: DateSlot =
              cell.slot ||
              {
                startDate: dayStart,
                endDate: new Date(dayStart.getTime()),
                price: journey.price || 0,
              };
            const isSelected =
              selectedSlot && isSameCalendarDay(dayStart, selectedSlot.startDate);

            return (
              <button
                key={i}
                type="button"
                disabled={!isClickable}
                onClick={(e) => {
                  if (isClickable) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDayClick(e, activeSlot);
                  }
                }}
                className={`
                  aspect-square rounded-md text-sm font-medium transition-colors select-none
                  ${!isClickable ? 'text-gray-300 bg-gray-100 cursor-default' : 'text-gray-900 bg-white hover:bg-[#2D4033]/15 cursor-pointer'}
                  ${isSelected ? 'text-white cursor-pointer' : ''}
                `}
                style={isSelected ? { backgroundColor: THEME_GREEN } : undefined}
              >
                {cell.date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-sm text-gray-500 block">Price from</span>
            {selectedSlot ? (
              <span
                className="text-xl text-gray-900"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                ${selectedSlot.price.toLocaleString()}
              </span>
            ) : (
              <span className="text-base text-gray-400">Select a date</span>
            )}
          </div>
          {onBookingClick && (
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => selectedSlot && onBookingClick(selectedSlot.startDate, selectedSlot.price)}
              className={`
                px-6 py-2.5 text-xs tracking-widest uppercase transition-colors
                ${selectedSlot
                  ? 'text-white hover:opacity-90 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              style={selectedSlot ? { backgroundColor: THEME_GREEN } : undefined}
            >
              REQUEST TO BOOK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
