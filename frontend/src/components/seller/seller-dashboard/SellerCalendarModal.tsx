"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RotateCcw,
  Check,
  Search,
} from "lucide-react";
import styles from "./SellerCalendarModal.module.css";

export interface SellerCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Helper to format Date to YYYY-MM-DD using local time
export const formatDateToYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const SellerCalendarModal: React.FC<SellerCalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const todayYMD = useMemo(() => formatDateToYMD(new Date()), []);

  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const [directDateInput, setDirectDateInput] = useState(selectedDate || todayYMD);

  useEffect(() => {
    if (isOpen) {
      if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        const [y, m, d] = selectedDate.split("-").map(Number);
        setViewDate(new Date(y, m - 1, d));
        setDirectDateInput(selectedDate);
      } else {
        setViewDate(new Date());
        setDirectDateInput(todayYMD);
      }
    }
  }, [isOpen, selectedDate, todayYMD]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevYear = () => {
    setViewDate(new Date(currentYear - 1, currentMonth, 1));
  };

  const handleNextYear = () => {
    setViewDate(new Date(currentYear + 1, currentMonth, 1));
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    setViewDate(new Date(currentYear, newMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, currentMonth, 1));
  };

  // Quick Preset Handlers
  const handlePresetClick = (daysAgo: number) => {
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    const ymd = formatDateToYMD(target);
    onSelectDate(ymd);
    onClose();
  };

  const handlePresetMonthAgo = () => {
    const target = new Date();
    target.setMonth(target.getMonth() - 1);
    const ymd = formatDateToYMD(target);
    onSelectDate(ymd);
    onClose();
  };

  const handlePresetYearAgo = () => {
    const target = new Date();
    target.setFullYear(target.getFullYear() - 1);
    const ymd = formatDateToYMD(target);
    onSelectDate(ymd);
    onClose();
  };

  // Direct Input Handler
  const handleDirectInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (directDateInput && /^\d{4}-\d{2}-\d{2}$/.test(directDateInput)) {
      onSelectDate(directDateInput);
      onClose();
    }
  };

  // Days Grid Generation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  // Leading days from previous month
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateObj = new Date(currentYear, currentMonth - 1, dayNum);
    const ymd = formatDateToYMD(dateObj);
    calendarDays.push({
      dayNum,
      dateYMD: ymd,
      isCurrentMonth: false,
      isToday: ymd === todayYMD,
      isSelected: ymd === selectedDate,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const ymd = formatDateToYMD(dateObj);
    calendarDays.push({
      dayNum: d,
      dateYMD: ymd,
      isCurrentMonth: true,
      isToday: ymd === todayYMD,
      isSelected: ymd === selectedDate,
    });
  }

  // Trailing days from next month
  const totalSlots = Math.ceil(calendarDays.length / 7) * 7;
  const trailingCount = totalSlots - calendarDays.length;
  for (let t = 1; t <= trailingCount; t++) {
    const dateObj = new Date(currentYear, currentMonth + 1, t);
    const ymd = formatDateToYMD(dateObj);
    calendarDays.push({
      dayNum: t,
      dateYMD: ymd,
      isCurrentMonth: false,
      isToday: ymd === todayYMD,
      isSelected: ymd === selectedDate,
    });
  }

  const handleDayClick = (ymd: string) => {
    onSelectDate(ymd);
    onClose();
  };

  const formattedDisplaySelected = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today";

  return (
    <div
      className={styles.calendarOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Operations Calendar Filter"
    >
      <div className={styles.calendarCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h3 className={styles.headerTitle}>
              <CalendarIcon size={18} className={styles.calendarIconHeader} />
              <span>Operations Calendar</span>
            </h3>
            <p className={styles.headerSubtitle}>
              Filter revenue, orders &amp; COD amounts by historical date
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close calendar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Quick Presets Section */}
          <div className={styles.presetsSection}>
            <span className={styles.presetsLabel}>Quick Presets</span>
            <div className={styles.presetsRow}>
              <button
                type="button"
                className={`${styles.presetBtn} ${selectedDate === todayYMD ? styles.presetBtnActive : ""}`}
                onClick={() => handlePresetClick(0)}
              >
                Today
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => handlePresetClick(1)}
              >
                Yesterday
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => handlePresetClick(4)}
              >
                4 Days Ago
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => handlePresetClick(7)}
              >
                7 Days Ago
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={handlePresetMonthAgo}
              >
                1 Month Ago
              </button>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={handlePresetYearAgo}
              >
                1 Year Ago
              </button>
            </div>
          </div>

          {/* Direct Date Search Input */}
          <form onSubmit={handleDirectInputSubmit} className={styles.inputSearchRow}>
            <Search size={16} color="#EA580C" style={{ flexShrink: 0 }} />
            <input
              type="date"
              className={styles.directDateInput}
              value={directDateInput}
              onChange={(e) => setDirectDateInput(e.target.value)}
              aria-label="Select custom date"
            />
            <button type="submit" className={styles.applyInputBtn}>
              View Date
            </button>
          </form>

          {/* Month & Year Navigator */}
          <div className={styles.navRow}>
            <div className={styles.navBtnGroup}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handlePrevYear}
                title="Previous Year"
                aria-label="Previous Year"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handlePrevMonth}
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className={styles.navSelectGroup}>
              <select
                className={styles.navSelect}
                value={currentMonth}
                onChange={handleMonthChange}
                aria-label="Select month"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className={styles.navSelect}
                value={currentYear}
                onChange={handleYearChange}
                aria-label="Select year"
              >
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.navBtnGroup}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handleNextMonth}
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={handleNextYear}
                title="Next Year"
                aria-label="Next Year"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className={styles.calendarGridContainer}>
            <div className={styles.weekdaysRow}>
              {WEEKDAYS.map((wd) => (
                <span key={wd}>{wd}</span>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {calendarDays.map((cell) => {
                const isSelected = cell.isSelected;
                const isToday = cell.isToday;
                const isOtherMonth = !cell.isCurrentMonth;

                return (
                  <button
                    key={cell.dateYMD}
                    type="button"
                    className={`${styles.dayCell} ${
                      isOtherMonth ? styles.dayCellOtherMonth : ""
                    } ${isToday ? styles.dayCellToday : ""} ${
                      isSelected ? styles.dayCellSelected : ""
                    }`}
                    onClick={() => handleDayClick(cell.dateYMD)}
                    aria-label={`Select date ${cell.dateYMD}`}
                    aria-pressed={isSelected}
                  >
                    {cell.dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.selectedSummary}>
            <span className={styles.selectedSummaryLabel}>Currently Selected:</span>
            <span className={styles.selectedSummaryValue}>
              {formattedDisplaySelected}
              {selectedDate === todayYMD ? " (Today)" : ""}
            </span>
          </div>

          <div className={styles.footerActions}>
            {selectedDate !== todayYMD && (
              <button
                type="button"
                className={styles.todayBtn}
                onClick={() => handlePresetClick(0)}
              >
                <RotateCcw size={13} style={{ marginRight: "4px", display: "inline" }} />
                Reset Today
              </button>
            )}
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerCalendarModal;
