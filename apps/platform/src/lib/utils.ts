import type { Metadata } from "next";

export function generateAvatarFallback(string: string) {
  const names = string.split(" ").filter(Boolean);
  const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

  return mapped.join("");
}

export function generateMeta({
  title,
  additionalTitle = false,
  description,
  canonical,
}: {
  title: string;
  additionalTitle?: boolean;
  description: string;
  canonical: string;
}): Metadata {
  return {
    alternates: {
      canonical: `/dashboard${canonical}`,
    },
    description,
    metadataBase: new URL(`https://shadcnuikit.com`),
    openGraph: {
      images: [`/images/seo.jpg`],
    },
    title: `${title} for Shadcn UI${additionalTitle ? " – Admin Dashboard Template" : ""}`,
  };
}

// a function to get the first letter of the first and last name of names
export const getInitials = (fullName: string) => {
  const nameParts = fullName.split(" ");
  const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
  const lastNameInitial = nameParts[1].charAt(0).toUpperCase();
  return `${firstNameInitial}${lastNameInitial}`;
};
