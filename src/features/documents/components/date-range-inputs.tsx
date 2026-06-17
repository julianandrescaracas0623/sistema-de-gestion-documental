"use client";

import { useState } from "react";

import { todayLocalDateString } from "@/features/documents/lib/date-utils";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface DateRangeInputsProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function DateRangeInputs({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: DateRangeInputsProps) {
  const today = todayLocalDateString();
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);

  const handleFromChange = (value: string) => {
    setFrom(value);
    onDateFromChange(value);
    if (to !== "" && value !== "" && value > to) {
      setTo(value);
      onDateToChange(value);
    }
  };

  const handleToChange = (value: string) => {
    setTo(value);
    onDateToChange(value);
    if (from !== "" && value !== "" && value < from) {
      setFrom(value);
      onDateFromChange(value);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="dateFrom">Desde</Label>
        <Input
          id="dateFrom"
          name="dateFrom"
          type="date"
          value={from}
          max={to !== "" ? to : today}
          onChange={(e) => {
            handleFromChange(e.target.value);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dateTo">Hasta</Label>
        <Input
          id="dateTo"
          name="dateTo"
          type="date"
          value={to}
          min={from !== "" ? from : undefined}
          max={today}
          onChange={(e) => {
            handleToChange(e.target.value);
          }}
        />
      </div>
    </>
  );
}
