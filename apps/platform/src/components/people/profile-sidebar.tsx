"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@alice/user-interface/components/card";
import { Progress } from "@alice/user-interface/components/progress";
import {
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";

import { useProfileStore } from "../store";

export function ProfileSidebar() {
  const { user, profileCompletion } = useProfileStore();

  return (
    <div className="space-y-4">
      {/* Useful for admins: shows how much contact detail is missing. The percentage is email, phone, date of birth and address filled in. */}
      <Card>
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Progress
              value={profileCompletion}
              className="flex-1"
              indicatorColor="bg-green-500"
            />
            <span className="text-muted-foreground text-xs">
              {profileCompletion}%
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold">About</h3>

        <div className="grid grid-cols-2 space-y-4 md:grid-cols-3 lg:space-y-8 xl:grid-cols-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Users className="text-muted-foreground h-4 w-4" />
              <span>{user.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="text-muted-foreground h-4 w-4" />
              {/* No "department" in a club. Shows their main position for players instead. */}
              <span>{user.department}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <TrendingUp className="text-muted-foreground h-4 w-4" />
              <span>{user.role}</span>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-medium uppercase">
              Contacts
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span>{user.phone}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-medium uppercase">
              Teams
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Users className="text-muted-foreground h-4 w-4" />
                <span>
                  Member of {user.teams} {user.teams === 1 ? "team" : "teams"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="text-muted-foreground h-4 w-4" />
                <span>
                  {user.files} {user.files === 1 ? "file" : "files"} on record
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
