"use client";

import { Badge } from "@alice/user-interface/components/badge";
import { Button } from "@alice/user-interface/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@alice/user-interface/components/dropdown-menu";
import { toast } from "@alice/user-interface/components/sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@alice/user-interface/components/tabs";
import { Link2, MoreHorizontal, Pencil, Share2, UserX } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityStream } from "@/components/people/activity-stream";
import { ConnectionsTeams } from "@/components/people/connections-teams";
import { PersonFiles } from "@/components/people/person-files";
import { PersonTeams } from "@/components/people/person-teams";
import { ProfileHeader } from "@/components/people/profile-header";
import { ProfileSidebar } from "@/components/people/profile-sidebar";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileProvider, ProfileToolsProvider } from "@/components/store";
import type { ProfileTools, TeamOption } from "@/components/store";
import { authClient } from "@/lib/auth-client";
import { huddlekit } from "@/lib/huddle-kit";
import {
  addPersonDocument,
  loadPersonFiles,
  openPersonFile,
  removePersonFile,
  setPersonImage,
} from "@/lib/people-files";
import type { PersonFile } from "@/lib/people-files";
import {
  currentMemberships,
  documentsOf,
  personTeams,
  toProfile,
} from "@/lib/person-profile";
import type { PersonDetail } from "@/lib/person-profile";

// Copies this profile's address so it can be pasted to someone.
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  } catch {
    toast.error("Could not copy the link");
  }
};

// The page layout, unchanged from the template. It reads the person through
// the profile store, which `Page` below fills from the API.
function ProfileLayout({
  fileCount,
  teamCount,
}: {
  fileCount: number;
  teamCount: number;
}) {
  return (
    <div className="mx-auto min-h-screen lg:max-w-7xl xl:pt-6">
      <div className="space-y-4 lg:space-y-6">
        <div className="bg-card overflow-hidden rounded-md border">
          <ProfileHeader />

          <div className="border-t">
            <div className="flex items-center justify-between px-4">
              <Tabs defaultValue="profile" className="flex-1">
                <TabsList className="-mb-0.5 h-auto! gap-6 border-none bg-transparent p-0">
                  <TabsTrigger
                    value="profile"
                    className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!"
                  >
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="teams"
                    className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!"
                  >
                    Teams
                    {/* Real count: the teams this person is on now. */}
                    <Badge variant="secondary" className="rounded-full">
                      {teamCount}
                    </Badge>
                  </TabsTrigger>
                  {/* Replaces the template's "Projects" tab: documents kept on this person's record. */}
                  <TabsTrigger
                    value="files"
                    className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!"
                  >
                    Files
                    <Badge variant="secondary" className="rounded-full">
                      {fileCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                {/* Not needed: people are not "connected" in a club. Could become "Add to team" or "Message" once those exist. */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon-sm">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Needs doing: no save yet. The edit dialog in the header and the update endpoint (PATCH /people/{id}) are not connected. */}
                    <DropdownMenuItem>
                      <Pencil />
                      Edit profile
                    </DropdownMenuItem>
                    {/* Not needed: profiles are private to the club, so there is nothing to share publicly. */}
                    <DropdownMenuItem>
                      <Share2 />
                      Share profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        void copyLink();
                      }}
                    >
                      <Link2 />
                      Copy link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="gap-4 space-y-4 lg:grid lg:gap-6 lg:space-y-0 xl:grid-cols-[300px_1fr]">
          <ProfileSidebar />

          <main className="space-y-4 lg:space-y-6">
            {/* Real: the teams this person is on, with add and remove. */}
            <PersonTeams />
            {/* Real: documents on their record, with upload and delete. Replaces the template's projects table. */}
            <PersonFiles />
            {/* Placeholder content: there is no activity feed in the API yet. Could show registrations, payments and attendance. */}
            <ActivityStream />
            {/* Placeholder content. Real data exists for this: the person's teams (memberships) and family (relationships), but the detail endpoint returns ids, not names, so it needs extending first. */}
            <ConnectionsTeams />
          </main>
        </div>
      </div>
    </div>
  );
}

// Everything the profile shows, fetched together.
interface Everything {
  detail: PersonDetail;
  files: PersonFile[];
  teams: TeamOption[];
}

// Tagged with the person it was fetched for, so moving between profiles never
// shows the previous one.
type Loaded =
  | { id: string; status: "failed" }
  | { data: Everything; id: string; status: "ready" };

const fetchEverything = async (id: string): Promise<Everything> => {
  const [detail, files, teams] = await Promise.all([
    huddlekit.people.retrievePerson(id),
    loadPersonFiles(id),
    // The picker is a convenience: if the club's teams cannot be listed, the
    // rest of the profile should still open.
    huddlekit.teams.list().catch(() => ({ teams: [] })),
  ]);
  return {
    detail,
    files,
    teams: teams.teams.map((team) => ({ id: team.id, name: team.name })),
  };
};

export default function Page() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  // The API reads the session's active club; the shell switches it to match
  // the URL in the background, so wait until it has.
  const { data: active } = authClient.useActiveOrganization();
  const clubIsActive = active?.slug === slug;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const load = loaded?.id === id ? loaded : null;

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      try {
        const data = await fetchEverything(id);
        if (!canceled) {
          setLoaded({ data, id, status: "ready" });
        }
      } catch {
        if (!canceled) {
          setLoaded({ id, status: "failed" });
        }
      }
    };
    if (clubIsActive) {
      void run();
    }
    return () => {
      canceled = true;
    };
  }, [clubIsActive, id]);

  // After any change, fetch again so the page shows what the server now has.
  const refresh = useCallback(async () => {
    try {
      setLoaded({ data: await fetchEverything(id), id, status: "ready" });
    } catch {
      toast.error("Could not refresh the profile. Reload the page.");
    }
  }, [id]);

  const data = load?.status === "ready" ? load.data : null;

  const tools = useMemo<ProfileTools>(
    () => ({
      addDocuments: async (chosen) => {
        const results = await Promise.allSettled(
          chosen.map(async (file) => {
            await addPersonDocument(id, file);
          })
        );
        const failed = results.flatMap((result, index) =>
          result.status === "rejected" ? [chosen[index]?.name ?? "a file"] : []
        );
        for (const name of failed) {
          toast.error(`Could not upload ${name}`);
        }
        if (failed.length < chosen.length) {
          toast.success(
            chosen.length - failed.length === 1
              ? "File uploaded"
              : "Files uploaded"
          );
          await refresh();
        }
      },
      addToTeam: async (input) => {
        try {
          await huddlekit.teams.createMember(input.teamId, {
            personId: id,
            role: input.role,
            shirtNumber: input.shirtNumber,
            startsOn: input.startsOn,
          });
        } catch {
          toast.error(
            "Could not add them to the team. Only club admins and the team's coaches can do this."
          );
          return false;
        }
        toast.success("Added to the team");
        await refresh();
        return true;
      },
      allTeams: data?.teams ?? [],
      documents: documentsOf(data?.files ?? []),
      leaveTeam: async (membershipId) => {
        try {
          await huddlekit.teams.endMembership(membershipId);
        } catch {
          toast.error(
            "Could not take them off the team. Only club admins and the team's coaches can do this."
          );
          return;
        }
        toast.success("Taken off the team");
        await refresh();
      },
      openFile: async (fileId) => {
        try {
          await openPersonFile(fileId);
        } catch {
          toast.error("Could not open that file");
        }
      },
      removeFile: async (linkId) => {
        try {
          await removePersonFile(id, linkId);
        } catch {
          toast.error("Could not delete that file");
          return;
        }
        toast.success("File deleted");
        await refresh();
      },
      setImage: async (purpose, file) => {
        try {
          await setPersonImage(id, purpose, file);
        } catch {
          toast.error(
            `Could not update the ${purpose === "avatar" ? "photo" : "cover"}. You can change your own and your children's; club admins can change anyone's.`
          );
          return;
        }
        toast.success(purpose === "avatar" ? "Photo updated" : "Cover updated");
        await refresh();
      },
      teams: data ? personTeams(data.detail, data.teams) : [],
    }),
    [data, id, refresh]
  );

  const profile = useMemo(
    () => (data ? toProfile(data.detail, data.files) : null),
    [data]
  );

  if (data === null || profile === null) {
    return (
      <EmptyState
        icon={UserX}
        title={
          load?.status === "failed" ? "Could not open this person" : "Loading"
        }
        description={
          load?.status === "failed"
            ? "They may not exist, or you may not be allowed to see them."
            : "Fetching their profile."
        }
        action={{ href: `/${slug}/people`, label: "Back to people" }}
      />
    );
  }

  return (
    <ProfileProvider value={profile}>
      <ProfileToolsProvider value={tools}>
        <ProfileLayout
          fileCount={documentsOf(data.files).length}
          teamCount={currentMemberships(data.detail).length}
        />
      </ProfileToolsProvider>
    </ProfileProvider>
  );
}
