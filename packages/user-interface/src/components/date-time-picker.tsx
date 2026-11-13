"use client";

import { Button } from "@alice/ui/components/button";
import { Calendar } from "@alice/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@alice/ui/components/popover";
import { ScrollArea, ScrollBar } from "@alice/ui/components/scroll-area";
import { cn } from "cn";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

// One date and time picker for the whole app: a calendar with hour, minute and
// AM/PM columns for date and time, and the same calendar on its own for dates
// only. Both put a hidden value in the form when given a `name`, so they work
// inside plain forms as well as controlled ones.
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const MERIDIEMS = ["AM", "PM"] as const;
const NOON = 12;
const DEFAULT_HOUR = 9;
const FIRST_YEAR = 1920;
const YEARS_AHEAD = 20;
const THIS_YEAR = new Date().getFullYear();

const DATE_TIME_FORMAT = "dd/MM/yyyy hh:mm aa";
const DATE_FORMAT = "dd/MM/yyyy";
const DATE_VALUE = "yyyy-MM-dd";
const DATE_TIME_VALUE = "yyyy-MM-dd'T'HH:mm";

interface PickerProps {
  id?: string;
  // Gives the form a hidden value: yyyy-MM-dd, or yyyy-MM-dd'T'HH:mm.
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

function HiddenValue({
  name,
  value,
  required,
}: {
  name?: string;
  value: string;
  required?: boolean;
}) {
  if (name === undefined) {
    return null;
  }
  // A visually hidden text box, not type="hidden", so the browser still
  // checks `required`.
  return (
    <input
      className="pointer-events-none absolute size-px opacity-0"
      name={name}
      value={value}
      required={required}
      readOnly
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}

function PickerButton({
  id,
  label,
  placeholder,
  disabled,
  className,
}: {
  id?: string;
  label: string | undefined;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <PopoverTrigger asChild>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        className={cn(
          "h-10 w-full justify-start px-3 text-left font-normal",
          label === undefined && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="size-4" />
        {label ?? <span>{placeholder}</span>}
      </Button>
    </PopoverTrigger>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "default" : "ghost"}
      className="aspect-square shrink-0 sm:w-full"
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

interface DateTimePickerProps extends PickerProps {
  date: Date | undefined;
  setDate: (value: Date | undefined) => void;
}

// Date and time in one popover.
export function DateTimePicker({
  date,
  setDate,
  id,
  name,
  required,
  disabled,
  className,
  placeholder = "dd/mm/yyyy hh:mm",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selected: Date | undefined) => {
    if (selected === undefined) {
      return;
    }
    // Keep the time already chosen, or start the day at 9 in the morning.
    const next = new Date(selected);
    if (date === undefined) {
      next.setHours(DEFAULT_HOUR, 0, 0, 0);
    } else {
      next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    }
    setDate(next);
  };

  const change = (update: (next: Date) => void) => {
    const next = date === undefined ? new Date() : new Date(date);
    if (date === undefined) {
      next.setHours(DEFAULT_HOUR, 0, 0, 0);
    }
    update(next);
    setDate(next);
  };

  const hour = date?.getHours();
  const isPm = hour !== undefined && hour >= NOON;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PickerButton
        id={id}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
        label={date === undefined ? undefined : format(date, DATE_TIME_FORMAT)}
      />
      <HiddenValue
        name={name}
        required={required}
        value={date === undefined ? "" : format(date, DATE_TIME_VALUE)}
      />
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            defaultMonth={date}
            autoFocus
          />
          <div className="flex h-[300px] flex-col divide-y border-s sm:flex-row sm:divide-x sm:divide-y-0">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {HOURS.map((option) => (
                  <OptionButton
                    key={option}
                    active={hour !== undefined && hour % NOON === option % NOON}
                    onClick={() => {
                      change((next) => {
                        next.setHours((option % NOON) + (isPm ? NOON : 0));
                      });
                    }}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex p-2 sm:flex-col">
                {MINUTES.map((option) => (
                  <OptionButton
                    key={option}
                    active={date?.getMinutes() === option}
                    onClick={() => {
                      change((next) => {
                        next.setMinutes(option);
                      });
                    }}
                  >
                    {option.toString().padStart(2, "0")}
                  </OptionButton>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea>
              <div className="flex p-2 sm:flex-col">
                {MERIDIEMS.map((option) => (
                  <OptionButton
                    key={option}
                    active={hour !== undefined && (option === "PM") === isPm}
                    onClick={() => {
                      change((next) => {
                        const current = next.getHours() % NOON;
                        next.setHours(current + (option === "PM" ? NOON : 0));
                      });
                    }}
                  >
                    {option}
                  </OptionButton>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DatePickerProps extends PickerProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
}

// A date on its own, with month and year dropdowns so a date of birth or a
// certificate expiry is quick to reach.
export function DatePicker({
  value,
  onChange,
  id,
  name,
  required,
  disabled,
  className,
  placeholder = "dd/mm/yyyy",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PickerButton
        id={id}
        disabled={disabled}
        className={className}
        placeholder={placeholder}
        label={value === undefined ? undefined : format(value, DATE_FORMAT)}
      />
      <HiddenValue
        name={name}
        required={required}
        value={value === undefined ? "" : format(value, DATE_VALUE)}
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(selected) => {
            onChange(selected);
            if (selected !== undefined) {
              setOpen(false);
            }
          }}
          defaultMonth={value}
          captionLayout="dropdown"
          startMonth={new Date(FIRST_YEAR, 0)}
          endMonth={new Date(THIS_YEAR + YEARS_AHEAD, 11)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
