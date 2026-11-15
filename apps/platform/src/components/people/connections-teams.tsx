import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@alice/user-interface/components/avatar";
import { Button } from "@alice/user-interface/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@alice/user-interface/components/card";
import { Separator } from "@alice/user-interface/components/separator";
// Placeholder content: the people and teams listed here are made-up template data. See the note on <ConnectionsTeams /> in the profile page.
import {
  UserPlus,
  ChevronRight,
  UsersIcon,
  BadgeDollarSignIcon,
  ContainerIcon,
  PaletteIcon,
  UserCheck,
} from "lucide-react";

const connections = [
  {
    connections: 25,
    id: "1",
    initials: "R",
    name: "Rachel Doe",
    online: true,
    status: "connected",
  },
  {
    avatar:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
    connections: 79,
    id: "2",
    name: "Isabella Finley",
    online: true,
    status: "pending",
  },
  {
    avatar:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200",
    connections: 0,
    id: "3",
    name: "David Harrison",
    status: "connected",
  },
  {
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200",
    connections: 9,
    id: "4",
    name: "Costa Quinn",
    online: false,
    status: "pending",
  },
];

const teams = [
  { icon: UsersIcon, id: "1", members: 8, name: "#digitalmarketing" },
  { icon: BadgeDollarSignIcon, id: "2", members: 14, name: "#ethereum" },
  { icon: ContainerIcon, id: "3", members: 3, name: "#conference" },
  { icon: PaletteIcon, id: "4", members: 3, name: "#supportteam" },
];

export function ConnectionsTeams() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.map((connection) => (
            <div key={connection.id} className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="size-10">
                  {connection.avatar !== undefined &&
                  connection.avatar !== "" ? (
                    <AvatarImage
                      src={connection.avatar}
                      alt={connection.name}
                    />
                  ) : (
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {connection.initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                {connection.online === true && (
                  <div className="border-background bg-primary absolute right-0 bottom-0 h-3 w-3 rounded-full border-2" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">{connection.name}</p>
                <p className="text-muted-foreground text-sm">
                  {connection.connections} connections
                </p>
              </div>

              {connection.status === "connected" ? (
                <Button size="icon-sm" className="shrink-0 rounded-full">
                  <UserCheck />
                </Button>
              ) : (
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="shrink-0 rounded-full"
                >
                  <UserPlus />
                </Button>
              )}
            </div>
          ))}
          <Separator />

          <Button
            variant="link"
            className="text-muted-foreground flex w-full justify-between px-0!"
          >
            View all connections
            <ChevronRight />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center gap-4">
              <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                <team.icon className="size-5" />
              </div>

              <div className="flex-1">
                <p className="font-medium">{team.name}</p>
                <p className="text-muted-foreground text-sm">
                  {team.members} members
                </p>
              </div>
            </div>
          ))}
          <Separator />

          <Button
            variant="link"
            className="text-muted-foreground flex w-full justify-between px-0!"
          >
            View all teams
            <ChevronRight />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
