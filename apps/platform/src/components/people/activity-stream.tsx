import { Button } from "@alice/user-interface/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@alice/user-interface/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@alice/user-interface/components/dropdown-menu";
import { Separator } from "@alice/user-interface/components/separator";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@alice/user-interface/components/timeline";
// Placeholder content: everything in this file is made-up template data. There is no activity feed in the API yet.
import {
  Clock12Icon,
  FileText,
  Filter,
  MoreHorizontal,
  Settings,
  Download,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const activities = [
  {
    description: "Added 3 files to task",
    files: [
      {
        id: "weekly-excel",
        name: "weekly-reports.xls",
        size: "12kb",
        type: "excel",
      },
      {
        id: "weekly-word",
        name: "weekly-reports.xls",
        size: "4kb",
        type: "word",
      },
      {
        id: "monthly-word",
        name: "monthly-reports.xls",
        size: "8kb",
        type: "word",
      },
    ],
    id: "1",
    timestamp: "5 minutes ago",
    title: "Task report - uploaded weekly reports",
    type: "file-upload",
  },
  {
    badge: { color: "cyan", text: "Completed" },
    description: "Marked",
    id: "2",
    timestamp: "3 hours ago",
    title: "Project status updated",
    type: "status-update",
  },
  {
    description: "Added 3 images to",
    id: "3",
    images: [
      {
        id: "1",
        src: "https://plus.unsplash.com/premium_photo-1751667124857-32b5a1c63d8a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "2",
        src: "https://images.unsplash.com/photo-1747302793923-23f66490ae0d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=400",
      },
      {
        id: "3",
        src: "https://images.unsplash.com/photo-1756038714389-8ff4e5967ed5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=400",
      },
    ],
    timestamp: "Yesterday",
    title: "3 new photos added",
    type: "image-added",
  },
];

export function ActivityStream() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity stream</CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Filter />
                Filter by type
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download />
                Export activity
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Notification settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Timeline defaultValue={3}>
          {activities.map((activity) => (
            <TimelineItem
              key={activity.id}
              step={Number(activity.id)}
              className="space-y-2"
            >
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineTitle className="-mt-0.5">
                  {activity.title}
                </TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent className="space-y-4">
                {activity.files && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {activity.files.map((file) => (
                      <Link
                        href="#"
                        key={file.id}
                        className="bg-muted/30 hover:bg-muted flex items-center gap-3 rounded-lg border p-4"
                      >
                        <FileText className="text-muted-foreground size-5" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {file.size}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {activity.images && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {activity.images.map((img) => (
                      <figure key={img.id}>
                        <Image
                          className="aspect-video w-full rounded-lg"
                          src={img.src}
                          alt="Activity attachment"
                          height={225}
                          width={400}
                          unoptimized
                        />
                      </figure>
                    ))}
                  </div>
                )}

                {activity.timestamp && (
                  <TimelineDate className="mt-2 mb-0 flex items-center gap-1.5">
                    <Clock12Icon className="size-3" />
                    {activity.timestamp}
                  </TimelineDate>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>

        <Separator className="my-4" />

        <Button variant="link" className="text-muted-foreground w-full">
          View more
        </Button>
      </CardContent>
    </Card>
  );
}
