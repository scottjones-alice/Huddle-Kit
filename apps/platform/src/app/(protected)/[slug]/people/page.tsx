"use client";

import { toast } from "@alice/user-interface/components/sonner";
import { Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import PeopleTable from "@/components/people/user-table";
import { EmptyState } from "@/components/shared/empty-state";
import { authClient } from "@/lib/auth-client";
import { displayName, loadEveryone, setPersonActive } from "@/lib/people";
import type { Person } from "@/lib/people";

// The result is tagged with the club it was fetched for, so after switching
// club the old list is never shown: it simply stops matching the URL.
type Loaded =
  | { slug: string; status: "failed" }
  | { people: Person[]; slug: string; status: "ready" };

export default function PeoplePage() {
  const { slug } = useParams<{ slug: string }>();
  // The API lists the session's active club. The shell switches it to match
  // the URL in the background, so wait until it has.
  const { data: active } = authClient.useActiveOrganization();
  const clubIsActive = active?.slug === slug;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const load = loaded?.slug === slug ? loaded : null;

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      try {
        const people = await loadEveryone();
        if (!canceled) {
          setLoaded({ people, slug, status: "ready" });
        }
      } catch {
        if (!canceled) {
          setLoaded({ slug, status: "failed" });
        }
      }
    };
    if (clubIsActive) {
      void run();
    }
    return () => {
      canceled = true;
    };
  }, [clubIsActive, slug]);

  const setActive = useCallback(async (person: Person, isActive: boolean) => {
    const name = displayName(person);
    try {
      await setPersonActive(person.id, isActive);
    } catch {
      toast.error(
        `Could not ${isActive ? "restore" : "archive"} ${name}. Only club admins can do this.`
      );
      return;
    }
    setLoaded((previous) =>
      previous?.status === "ready"
        ? {
            ...previous,
            people: previous.people.map((entry) =>
              entry.id === person.id ? { ...entry, isActive } : entry
            ),
          }
        : previous
    );
    toast.success(`${name} ${isActive ? "restored" : "archived"}`);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="text-muted-foreground text-sm">
          Players, parents and staff in the club.
        </p>
      </div>
      {load?.status === "ready" ? (
        <PeopleTable people={load.people} onSetActive={setActive} />
      ) : (
        <EmptyState
          icon={Users}
          title={
            load?.status === "failed" ? "Could not load people" : "Loading"
          }
          description={
            load?.status === "failed"
              ? "Something went wrong fetching the club's people. Reload to try again."
              : "Fetching the club's people."
          }
        />
      )}
    </div>
  );
}
