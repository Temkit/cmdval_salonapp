"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  minYear = 1920,
  maxYear = new Date().getFullYear(),
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    if (value) {
      return new Date(value);
    }
    // Default to a date that makes sense for DOB (30 years ago)
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    return d;
  });

  const selectedDate = value ? new Date(value) : null;

  // Generate years array
  const years = React.useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear]);

  // Get days in current month view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (number | null)[] = [];

    // Add empty slots for days before the first
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add the days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(viewDate);

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleMonthChange = (month: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), month, 1));
  };

  const handleYearChange = (year: number) => {
    setViewDate(prev => new Date(year, prev.getMonth(), 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formattedDate = newDate.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      viewDate.getFullYear() === selectedDate.getFullYear() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-4 min-h-[56px] rounded-xl border-2 text-left transition-all",
          "hover:border-primary/50 focus:border-primary focus:outline-none",
          isOpen ? "border-primary bg-primary/5" : "border-border",
          value ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-base">
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground"
          >
            ×
          </button>
        )}
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Calendar */}
          <div className="absolute z-50 mt-2 w-full sm:w-[340px] p-4 bg-background border-2 border-border rounded-2xl shadow-lg">
            {/* Month/Year Selectors */}
            <div className="flex items-center gap-2 mb-4">
              {/* Month Selector */}
              <select
                value={viewDate.getMonth()}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="flex-1 h-12 px-3 rounded-xl border-2 border-border bg-background text-base font-medium focus:border-primary focus:outline-none"
              >
                {MONTHS.map((month, i) => (
                  <option key={month} value={i}>{month}</option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="w-24 h-12 px-3 rounded-xl border-2 border-border bg-background text-base font-medium focus:border-primary focus:outline-none"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-semibold">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => (
                <div key={i} className="aspect-square">
                  {day !== null && (
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "w-full h-full rounded-xl flex items-center justify-center text-base font-medium transition-all",
                        "min-h-[44px]", // Touch target
                        isSelected(day)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : isToday(day)
                          ? "bg-primary/10 text-primary border-2 border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-10"
                onClick={() => {
                  const today = new Date();
                  onChange(today.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
              >
                Aujourd'hui
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 h-10"
                onClick={handleClear}
              >
                Effacer
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Inline date picker with visible month/year wheels - great for tablets
 */
interface InlineDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

export function InlineDatePicker({
  value,
  onChange,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
  className,
}: InlineDatePickerProps) {
  // Parse the current value or default
  const parseValue = () => {
    if (value) {
      const d = new Date(value);
      return {
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
      };
    }
    return { day: 1, month: 0, year: 1990 };
  };

  const [selected, setSelected] = React.useState(parseValue);

  // Update when value changes externally
  React.useEffect(() => {
    if (value) {
      setSelected(parseValue());
    }
  }, [value]);

  const years = React.useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [minYear, maxYear]);

  const daysInMonth = new Date(selected.year, selected.month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const updateDate = (field: "day" | "month" | "year", val: number) => {
    const newSelected = { ...selected, [field]: val };

    // Adjust day if it exceeds the new month's days
    const maxDay = new Date(newSelected.year, newSelected.month + 1, 0).getDate();
    if (newSelected.day > maxDay) {
      newSelected.day = maxDay;
    }

    setSelected(newSelected);

    const date = new Date(newSelected.year, newSelected.month, newSelected.day);
    onChange(date.toISOString().split('T')[0]);
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {/* Day */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Jour</label>
        <select
          value={selected.day}
          onChange={(e) => updateDate("day", parseInt(e.target.value))}
          className="w-full h-14 px-3 rounded-xl border-2 border-border bg-background text-lg font-semibold text-center focus:border-primary focus:outline-none appearance-none cursor-pointer"
        >
          {daysArray.map((d) => (
            <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>
          ))}
        </select>
      </div>

      {/* Month */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Mois</label>
        <select
          value={selected.month}
          onChange={(e) => updateDate("month", parseInt(e.target.value))}
          className="w-full h-14 px-2 rounded-xl border-2 border-border bg-background text-lg font-semibold text-center focus:border-primary focus:outline-none appearance-none cursor-pointer"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>{m.slice(0, 3)}</option>
          ))}
        </select>
      </div>

      {/* Year */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Année</label>
        <select
          value={selected.year}
          onChange={(e) => updateDate("year", parseInt(e.target.value))}
          className="w-full h-14 px-3 rounded-xl border-2 border-border bg-background text-lg font-semibold text-center focus:border-primary focus:outline-none appearance-none cursor-pointer"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
