"use client";

import { TextField } from "@/components/onboarding/form-fields";

interface SocialLinksFieldsProps {
  prefix: string;
}

export function SocialLinksFields({ prefix }: SocialLinksFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        id={`${prefix}-facebook`}
        name={`${prefix}-facebook`}
        label="Facebook"
        optional
        placeholder="facebook.com/yourname"
      />
      <TextField
        id={`${prefix}-instagram`}
        name={`${prefix}-instagram`}
        label="Instagram"
        optional
        placeholder="@yourhandle"
      />
      <TextField
        id={`${prefix}-tiktok`}
        name={`${prefix}-tiktok`}
        label="TikTok"
        optional
        placeholder="@yourhandle"
      />
      <TextField
        id={`${prefix}-x`}
        name={`${prefix}-x`}
        label="X"
        optional
        placeholder="@yourhandle"
      />
    </div>
  );
}
