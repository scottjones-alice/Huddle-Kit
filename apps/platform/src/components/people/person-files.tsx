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
import { Button } from "@alice/user-interface/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@alice/user-interface/components/card";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { useProfileTools } from "@/components/store";
import type { PersonFile } from "@/lib/people-files";

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

const sizeLabel = (bytes: number): string =>
  bytes >= BYTES_PER_MB
    ? `${(bytes / BYTES_PER_MB).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / BYTES_PER_KB))} KB`;

const dateLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function RemoveFile({ entry }: { entry: PersonFile }) {
  const { removeFile } = useProfileTools();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <span className="sr-only">Delete {entry.file.fileName}</span>
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entry.file.fileName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the file from storage as well as from this record. It
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              void removeFile(entry.link.id);
            }}
          >
            Delete file
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Documents kept on this person's record, such as consent forms and letters. */
export function PersonFiles() {
  const { addDocuments, documents, openFile } = useProfileTools();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (chosen: FileList | null) => {
    if (chosen === null || chosen.length === 0) {
      return;
    }
    setUploading(true);
    await addDocuments([...chosen]);
    setUploading(false);
    // So choosing the same file again still counts as a change.
    if (input.current !== null) {
      input.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Files</CardTitle>
        <CardDescription>
          Consent forms, letters and other documents. Only club admins and this
          person&apos;s family can see these.
        </CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => input.current?.click()}
          >
            <Upload /> {uploading ? "Uploading..." : "Upload"}
          </Button>
          <input
            ref={input}
            type="file"
            multiple
            className="sr-only"
            aria-label="Upload files"
            onChange={(event) => {
              void upload(event.target.files);
            }}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-sm">
            <FileText className="size-6" />
            No files yet.
          </div>
        ) : (
          <ul className="divide-y">
            {documents.map((entry) => (
              <li
                key={entry.link.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {entry.file.fileName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {sizeLabel(entry.file.sizeBytes)} · Added{" "}
                      {dateLabel(entry.link.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      void openFile(entry.file.id);
                    }}
                  >
                    <span className="sr-only">Open {entry.file.fileName}</span>
                    <ExternalLink />
                  </Button>
                  <RemoveFile entry={entry} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
