"use client";

import { Button } from "@alice/user-interface/components/button";
import { PlusIcon, Trash2Icon } from "lucide-react";
import * as React from "react";

import { SelectField, TextField } from "@/components/onboarding/form-fields";
import type { Option } from "@/components/onboarding/options";

interface TextConfig {
  label: string;
  placeholder?: string;
  type?: React.ComponentProps<"input">["type"];
}

interface SelectConfig {
  label: string;
  options: readonly Option[];
}

interface ContactListProps {
  idPrefix: string;
  rowLabel: string;
  addLabel: string;
  primary: TextConfig;
  select?: SelectConfig;
  secondary?: TextConfig;
  defaultRows?: number;
  minRows?: number;
}

// A repeatable set of rows: emergency contacts, approved adults, team invites.
export function ContactList({
  idPrefix,
  rowLabel,
  addLabel,
  primary,
  select,
  secondary,
  defaultRows = 1,
  minRows = 1,
}: ContactListProps) {
  const nextRowId = React.useRef(defaultRows);
  const [rows, setRows] = React.useState<number[]>(() =>
    Array.from({ length: defaultRows }, (_, index) => index)
  );

  const addRow = () => {
    const rowId = nextRowId.current;
    nextRowId.current += 1;
    setRows((current) => [...current, rowId]);
  };

  const removeRow = (rowId: number) => {
    setRows((current) => current.filter((id) => id !== rowId));
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((rowId, index) => (
        <div
          key={rowId}
          className="border-input flex flex-col gap-4 rounded-2xl border p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {rowLabel} {index + 1}
            </p>
            {rows.length > minRows ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${rowLabel.toLowerCase()} ${index + 1}`}
                onClick={() => {
                  removeRow(rowId);
                }}
              >
                <Trash2Icon />
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id={`${idPrefix}-${rowId}-primary`}
              name={`${idPrefix}-${rowId}-primary`}
              label={primary.label}
              placeholder={primary.placeholder}
              type={primary.type}
            />
            {select ? (
              <SelectField
                id={`${idPrefix}-${rowId}-select`}
                name={`${idPrefix}-${rowId}-select`}
                label={select.label}
                options={select.options}
              />
            ) : null}
            {secondary ? (
              <TextField
                id={`${idPrefix}-${rowId}-secondary`}
                name={`${idPrefix}-${rowId}-secondary`}
                label={secondary.label}
                placeholder={secondary.placeholder}
                type={secondary.type}
              />
            ) : null}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-10 self-start"
        onClick={addRow}
      >
        <PlusIcon />
        {addLabel}
      </Button>
    </div>
  );
}
