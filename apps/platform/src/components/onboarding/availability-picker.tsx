"use client";

import { Checkbox } from "@alice/user-interface/components/checkbox";

import { isPresent } from "@/components/onboarding/is-present";
import { DAYS, TIME_SLOTS } from "@/components/onboarding/options";

interface AvailabilityPickerProps {
  name: string;
  legend: string;
  description?: string;
}

// Day by time-of-day grid. Used for member, staff and club schedules.
export function AvailabilityPicker({
  name,
  legend,
  description,
}: AvailabilityPickerProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 border-0 p-0">
      <div className="space-y-1">
        <legend className="text-sm font-semibold">{legend}</legend>
        {isPresent(description) ? (
          <p className="text-muted-foreground text-sm text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      <div className="border-input overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-80 text-sm">
          <thead>
            <tr>
              <th scope="col" className="p-3 text-start">
                <span className="sr-only">Day</span>
              </th>
              {TIME_SLOTS.map((slot) => (
                <th
                  key={slot.value}
                  scope="col"
                  className="p-3 text-center font-medium"
                >
                  {slot.label}
                  <span className="text-muted-foreground block text-xs font-normal">
                    {slot.description}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day.value} className="border-input border-t">
                <th scope="row" className="p-3 text-start font-medium">
                  {day.label}
                </th>
                {TIME_SLOTS.map((slot) => (
                  <td key={slot.value} className="p-3 text-center">
                    <Checkbox
                      name={`${name}-${day.value}-${slot.value}`}
                      aria-label={`${day.label} ${slot.label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
