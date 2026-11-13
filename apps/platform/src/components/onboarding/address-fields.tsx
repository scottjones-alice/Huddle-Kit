"use client";

import { useState } from "react";

import { AddressEditor } from "@/components/address/address-editor";
import { EMPTY_ADDRESS } from "@/lib/address";
import type { AddressValues } from "@/lib/address";

interface AddressFieldsProps {
  prefix: string;
}

export function AddressFields({ prefix }: AddressFieldsProps) {
  const [values, setValues] = useState<AddressValues>(EMPTY_ADDRESS);
  return (
    <AddressEditor
      idPrefix={prefix}
      values={values}
      onChange={(changes) => {
        setValues({ ...values, ...changes });
      }}
    />
  );
}
