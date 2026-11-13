import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@alice/user-interface/components/card";
import { CalendarDays, PoundSterling, Shield, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

// Placeholder tiles. Each one becomes a real summary once its page exists.
const TILES = [
  {
    description: "Squads, coaches and managers for this season.",
    icon: Shield,
    title: "Teams",
  },
  {
    description: "Players, parents and staff in the club.",
    icon: Users,
    title: "People",
  },
  {
    description: "Training sessions, fixtures and results.",
    icon: CalendarDays,
    title: "Calendar",
  },
  {
    description: "Fees, charges and payments received.",
    icon: PoundSterling,
    title: "Payments",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          This is a placeholder. The club overview will live here.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {TILES.map(({ description, icon, title }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={icon}
                title="Coming soon"
                description="This section is not built yet."
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
