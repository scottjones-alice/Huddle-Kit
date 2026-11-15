"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@alice/user-interface/components/alert-dialog";
import { Badge } from "@alice/user-interface/components/badge";
import { Button } from "@alice/user-interface/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@alice/user-interface/components/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@alice/user-interface/components/dialog";
import { Input } from "@alice/user-interface/components/input";
import { Label } from "@alice/user-interface/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@alice/user-interface/components/select";
import { Shield, UserMinus, UserPlus } from "lucide-react";
import { useId, useState } from "react";

import { TEAM_ROLES, useProfileTools } from "@/components/store";
import type { TeamRole } from "@/components/store";
import { roleLabel } from "@/lib/people";
import { today } from "@/lib/person-profile";

// Only players wear a shirt number.
const MAX_SHIRT_NUMBER = 999;

function AddToTeam() {
  const id = useId();
  const { addToTeam, allTeams, teams } = useProfileTools();
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState<TeamRole>("player");
  const [shirt, setShirt] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  const [saving, setSaving] = useState(false);

  // A person can hold several roles on one team, but offering a team they are
  // already on in the same role again would only be refused.
  const onTeam = new Set(teams.map((team) => team.teamId));
  const choices = allTeams.filter((team) => !onTeam.has(team.id));

  const submit = async () => {
    setSaving(true);
    const added = await addToTeam({
      role,
      shirtNumber: role === "player" && shirt !== "" ? Number(shirt) : null,
      startsOn,
      teamId,
    });
    setSaving(false);
    if (added) {
      setOpen(false);
      setTeamId("");
      setShirt("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus /> Add to team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to a team</DialogTitle>
          <DialogDescription>
            They show on the team&apos;s roster from the start date.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`${id}-team`}>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger id={`${id}-team`} className="w-full">
                <SelectValue
                  placeholder={
                    choices.length === 0 ? "No other teams" : "Choose a team"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {choices.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-role`}>Role</Label>
            <Select
              value={role}
              onValueChange={(value) => {
                const next = TEAM_ROLES.find((entry) => entry === value);
                if (next !== undefined) {
                  setRole(next);
                }
              }}
            >
              <SelectTrigger id={`${id}-role`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {roleLabel(entry)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`${id}-start`}>Starts</Label>
              <Input
                id={`${id}-start`}
                type="date"
                required
                value={startsOn}
                onChange={(event) => {
                  setStartsOn(event.target.value);
                }}
              />
            </div>
            {role === "player" ? (
              <div className="w-28 space-y-2">
                <Label htmlFor={`${id}-shirt`}>Shirt no.</Label>
                <Input
                  id={`${id}-shirt`}
                  type="number"
                  min={0}
                  max={MAX_SHIRT_NUMBER}
                  value={shirt}
                  onChange={(event) => {
                    setShirt(event.target.value);
                  }}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={teamId === "" || saving}>
              {saving ? "Adding..." : "Add to team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeaveTeam({
  membershipId,
  teamName,
}: {
  membershipId: string;
  teamName: string;
}) {
  const { leaveTeam } = useProfileTools();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <span className="sr-only">Take off {teamName}</span>
          <UserMinus />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Take them off {teamName}?</AlertDialogTitle>
          <AlertDialogDescription>
            They leave the roster from today. The record stays as history of who
            played and when.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void leaveTeam(membershipId);
            }}
          >
            Take off team
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The teams this person is on, with a way to add and remove them. */
export function PersonTeams() {
  const { teams } = useProfileTools();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardAction>
          <AddToTeam />
        </CardAction>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-sm">
            <Shield className="size-6" />
            Not on any team yet.
          </div>
        ) : (
          <ul className="divide-y">
            {teams.map((team) => (
              <li
                key={team.membershipId}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {team.teamName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Since {team.startsOn}
                    {team.endsOn === null ? "" : `, until ${team.endsOn}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {team.shirtNumber === null ? null : (
                    <Badge variant="outline">#{team.shirtNumber}</Badge>
                  )}
                  <Badge variant="secondary">{roleLabel(team.role)}</Badge>
                  <LeaveTeam
                    membershipId={team.membershipId}
                    teamName={team.teamName}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
