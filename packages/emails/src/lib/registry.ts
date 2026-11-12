/**
 * Template registry: one place that maps a template name to its component and
 * subject line. Senders (Resend, Novu, …) only need the name and props.
 *
 * To add a template: create it in `src/templates/`, then add its props to
 * `EmailPropsMap` and an entry to `emailTemplates` below.
 */

import type { ComponentType } from "react";

import { AcceptInviteEmail } from "../templates/accept-invite";
import type { AcceptInviteEmailProps } from "../templates/accept-invite";
import { ForgotPasswordEmail } from "../templates/forgot-password";
import type { ForgotPasswordEmailProps } from "../templates/forgot-password";
import { PasswordResetEmail } from "../templates/password-reset";
import type { PasswordResetEmailProps } from "../templates/password-reset";
import { VerifyEmail } from "../templates/verify-email";
import type { VerifyEmailProps } from "../templates/verify-email";
import { WelcomeEmail } from "../templates/welcome";
import type { WelcomeEmailProps } from "../templates/welcome";
import { brand } from "./brand";

export interface EmailPropsMap {
  "accept-invite": AcceptInviteEmailProps;
  "forgot-password": ForgotPasswordEmailProps;
  "password-reset": PasswordResetEmailProps;
  "verify-email": VerifyEmailProps;
  welcome: WelcomeEmailProps;
}

export type EmailTemplateName = keyof EmailPropsMap;

export interface EmailTemplateDefinition<Props> {
  component: ComponentType<Props>;
  subject: (props: Props) => string;
}

export const emailTemplates: {
  [Name in EmailTemplateName]: EmailTemplateDefinition<EmailPropsMap[Name]>;
} = {
  "accept-invite": {
    component: AcceptInviteEmail,
    subject: ({ inviterName, teamName }) =>
      `${inviterName} invited you to join ${teamName}`,
  },
  "forgot-password": {
    component: ForgotPasswordEmail,
    subject: () => "Reset your password",
  },
  "password-reset": {
    component: PasswordResetEmail,
    subject: () => "Your password has been reset",
  },
  "verify-email": {
    component: VerifyEmail,
    subject: () => "Verify your email address",
  },
  welcome: {
    component: WelcomeEmail,
    subject: () => `Welcome to ${brand.name}`,
  },
};
