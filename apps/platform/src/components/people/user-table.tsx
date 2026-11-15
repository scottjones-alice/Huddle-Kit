"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@alice/user-interface/components/avatar";
import { Badge } from "@alice/user-interface/components/badge";
import { Button } from "@alice/user-interface/components/button";
import { Card, CardContent } from "@alice/user-interface/components/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@alice/user-interface/components/dropdown-menu";
import { Input } from "@alice/user-interface/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@alice/user-interface/components/select";
import { toast } from "@alice/user-interface/components/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@alice/user-interface/components/table";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  ListFilterIcon,
  MailIcon,
  MoreHorizontalIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { displayName, rolesOf } from "@/lib/people";
import type { Person } from "@/lib/people";
import { generateAvatarFallback } from "@/lib/utils";

const PAGE_SIZES = [12, 24, 48] as const;
// Badges shown in a cell before the rest collapse into "+n".
const BADGES_SHOWN = 2;

/* -------------------------------------------------------------------------- */
/*                                   Filters                                  */
/* -------------------------------------------------------------------------- */

type FilterId = "status" | "role" | "team" | "login";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  id: FilterId;
  label: string;
  /** The choices on offer, drawn from the people in the club. */
  options: (people: Person[]) => FilterOption[];
  /** True when the person has any of the chosen values. */
  matches: (person: Person, values: string[]) => boolean;
}

const byLabel = (a: FilterOption, b: FilterOption) =>
  a.label.localeCompare(b.label);

const FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    matches: (person, values) =>
      new Set(values).has(person.isActive ? "active" : "archived"),
    options: () => [
      { label: "Active", value: "active" },
      { label: "Archived", value: "archived" },
    ],
  },
  {
    id: "role",
    label: "Role",
    matches: (person, values) => {
      const wanted = new Set(values);
      return rolesOf(person).some((role) => wanted.has(role));
    },
    options: (people) =>
      [...new Set(people.flatMap(rolesOf))]
        .map((role) => ({ label: role, value: role }))
        .toSorted(byLabel),
  },
  {
    id: "team",
    label: "Team",
    matches: (person, values) => {
      const wanted = new Set(values);
      return person.teams.some((team) => wanted.has(team.teamId));
    },
    options: (people) => {
      const teams = new Map<string, string>();
      for (const person of people) {
        for (const team of person.teams) {
          teams.set(team.teamId, team.teamName);
        }
      }
      return [...teams]
        .map(([value, label]) => ({ label, value }))
        .toSorted(byLabel);
    },
  },
  {
    id: "login",
    label: "Login",
    matches: (person, values) =>
      new Set(values).has(person.userId === null ? "none" : "has"),
    options: () => [
      { label: "Has a login", value: "has" },
      { label: "No login", value: "none" },
    ],
  },
];

/** The values picked for each filter. A filter with none picked is off. */
type Filters = Partial<Record<FilterId, string[]>>;

/* -------------------------------------------------------------------------- */
/*                                   Sorting                                  */
/* -------------------------------------------------------------------------- */

type SortKey = "name" | "email" | "status";
interface Sort {
  ascending: boolean;
  key: SortKey;
}

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

const sortValue = (person: Person, key: SortKey): string => {
  if (key === "name") {
    return `${person.lastName} ${person.firstName}`;
  }
  if (key === "email") {
    return person.email ?? "";
  }
  return person.isActive ? "active" : "archived";
};

function SortableHead({
  children,
  onSort,
  sort,
  sortKey,
}: {
  children: string;
  onSort: (key: SortKey) => void;
  sort: Sort;
  sortKey: SortKey;
}) {
  const Arrow = sort.ascending ? ArrowUpIcon : ArrowDownIcon;
  return (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2.5"
        onClick={() => {
          onSort(sortKey);
        }}
      >
        {children}
        {sort.key === sortKey ? <Arrow /> : null}
      </Button>
    </TableHead>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Cells                                   */
/* -------------------------------------------------------------------------- */

/** The first few as badges, then "+n" for the rest. */
function BadgeList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const rest = items.length - BADGES_SHOWN;
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, BADGES_SHOWN).map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
      {rest > 0 ? (
        <Badge variant="outline" title={items.slice(BADGES_SHOWN).join(", ")}>
          +{rest}
        </Badge>
      ) : null}
    </div>
  );
}

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error(`Could not copy the ${what.toLowerCase()}`);
  }
};

function RowActions({
  href,
  onSetActive,
  person,
}: {
  href: string;
  onSetActive: (person: Person, isActive: boolean) => Promise<void>;
  person: Person;
}) {
  const name = displayName(person);
  return (
    <div className="text-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <span className="sr-only">Actions for {name}</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={href}>
              <UserIcon /> View profile
            </Link>
          </DropdownMenuItem>
          {person.email === null ? null : (
            <>
              <DropdownMenuItem asChild>
                <a href={`mailto:${person.email}`}>
                  <MailIcon /> Send email
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void copy(person.email ?? "", "Email");
                }}
              >
                <CopyIcon /> Copy email
              </DropdownMenuItem>
            </>
          )}
          {person.phone === null ? null : (
            <DropdownMenuItem
              onSelect={() => {
                void copy(person.phone ?? "", "Phone number");
              }}
            >
              <CopyIcon /> Copy phone
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={person.isActive ? "destructive" : "default"}
            onSelect={() => {
              void onSetActive(person, !person.isActive);
            }}
          >
            {person.isActive ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
            {person.isActive ? "Archive" : "Restore"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Table                                   */
/* -------------------------------------------------------------------------- */

export default function PeopleTable({
  onSetActive,
  people,
}: {
  /** Archive or restore. Should say so itself if it fails. */
  onSetActive: (person: Person, isActive: boolean) => Promise<void>;
  people: Person[];
}) {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [sort, setSort] = useState<Sort>({ ascending: true, key: "name" });
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [pageIndex, setPageIndex] = useState(0);

  const choices = useMemo(
    () => FIELDS.map((field) => ({ field, options: field.options(people) })),
    [people]
  );
  const activeFilters = FIELDS.filter(
    (field) => (filters[field.id]?.length ?? 0) > 0
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matching = people.filter((person) => {
      for (const field of FIELDS) {
        const values = filters[field.id] ?? [];
        if (values.length > 0 && !field.matches(person, values)) {
          return false;
        }
      }
      if (term === "") {
        return true;
      }
      const haystack = `${displayName(person)} ${person.firstName} ${person.email ?? ""} ${person.phone ?? ""}`;
      return haystack.toLowerCase().includes(term);
    });
    const direction = sort.ascending ? 1 : -1;
    return matching.toSorted(
      (a, b) =>
        direction *
        collator.compare(sortValue(a, sort.key), sortValue(b, sort.key))
    );
  }, [filters, people, search, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  // A narrower filter can leave the saved page past the end.
  const page = Math.min(pageIndex, pageCount - 1);
  const visible = rows.slice(page * pageSize, (page + 1) * pageSize);
  const firstRow = rows.length === 0 ? 0 : page * pageSize + 1;
  const lastRow = Math.min((page + 1) * pageSize, rows.length);

  const changeSort = (key: SortKey) => {
    setSort((previous) => ({
      ascending: previous.key === key ? !previous.ascending : true,
      key,
    }));
  };

  const toggleValue = (id: FilterId, value: string) => {
    setFilters((previous) => {
      const current = previous[id] ?? [];
      return {
        ...previous,
        [id]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
    setPageIndex(0);
  };

  const clearFilter = (id: FilterId) => {
    setFilters((previous) => ({ ...previous, [id]: [] }));
    setPageIndex(0);
  };

  const clearAll = () => {
    setFilters({});
    setPageIndex(0);
  };

  const chipText = (field: FilterField) => {
    const picked = filters[field.id] ?? [];
    const options = choices.find((entry) => entry.field.id === field.id);
    const names = picked.map(
      (value) =>
        options?.options.find((option) => option.value === value)?.label ??
        value
    );
    return `${field.label}: ${names.join(", ")}`;
  };

  return (
    <Card>
      <CardContent className="flex flex-col p-0">
        <div className="flex min-h-14 flex-wrap items-center gap-2 border-b px-(--card-spacing) py-3">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              aria-label="Search people"
              placeholder="Search people..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageIndex(0);
              }}
              className="h-7 w-48 ps-8 text-[0.8rem] lg:w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilterIcon /> Filters
                {activeFilters.length > 0 ? (
                  <Badge variant="secondary">{activeFilters.length}</Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {choices.map(({ field, options }) => (
                <DropdownMenuSub key={field.id}>
                  <DropdownMenuSubTrigger disabled={options.length === 0}>
                    {field.label}
                    {(filters[field.id]?.length ?? 0) > 0 ? (
                      <span className="text-muted-foreground ms-auto pe-2 text-xs tabular-nums">
                        {filters[field.id]?.length}
                      </span>
                    ) : null}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                    {options.map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={
                          filters[field.id]?.includes(option.value) ?? false
                        }
                        // Keep the menu open so several values can be ticked.
                        onSelect={(event) => {
                          event.preventDefault();
                          toggleValue(field.id, option.value);
                        }}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {activeFilters.map((field) => (
            <Badge key={field.id} variant="outline" className="gap-1 pe-1">
              {chipText(field)}
              <button
                type="button"
                className="hover:bg-muted rounded-full p-0.5"
                onClick={() => {
                  clearFilter(field.id);
                }}
              >
                <span className="sr-only">Remove {field.label} filter</span>
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
          {activeFilters.length > 1 ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          ) : null}
        </div>

        <Table className="[&_td:first-child]:ps-(--card-spacing) [&_td:last-child]:pe-(--card-spacing) [&_th:first-child]:ps-(--card-spacing) [&_th:last-child]:pe-(--card-spacing)">
          <TableHeader>
            <TableRow>
              <SortableHead sort={sort} sortKey="name" onSort={changeSort}>
                Name
              </SortableHead>
              <TableHead>Role</TableHead>
              <TableHead>Teams</TableHead>
              <SortableHead sort={sort} sortKey="email" onSort={changeSort}>
                Email
              </SortableHead>
              <TableHead>Login</TableHead>
              <SortableHead sort={sort} sortKey="status" onSort={changeSort}>
                Status
              </SortableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length > 0 ? (
              visible.map((person) => {
                const href = `/${slug}/people/${person.id}`;
                return (
                  <TableRow
                    key={person.id}
                    className={person.isActive ? undefined : "opacity-60"}
                  >
                    <TableCell>
                      <Link
                        href={href}
                        className="flex min-w-0 items-center gap-3 hover:underline"
                      >
                        <Avatar className="size-8">
                          {person.avatarUrl === null ? null : (
                            <AvatarImage
                              src={person.avatarUrl}
                              alt={displayName(person)}
                            />
                          )}
                          <AvatarFallback>
                            {generateAvatarFallback(
                              `${person.firstName} ${person.lastName}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">
                          {displayName(person)}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <BadgeList items={rolesOf(person)} />
                    </TableCell>
                    <TableCell>
                      <BadgeList
                        items={[
                          ...new Set(person.teams.map((team) => team.teamName)),
                        ]}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {person.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {person.userId === null ? (
                        <span className="text-muted-foreground">No login</span>
                      ) : (
                        "Has login"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={person.isActive ? "secondary" : "outline"}
                      >
                        {person.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RowActions
                        href={href}
                        onSetActive={onSetActive}
                        person={person}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {people.length === 0
                    ? "No one has been added to this club yet."
                    : "No one matches these filters."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col items-center justify-between gap-3 border-t px-(--card-spacing) py-3 sm:flex-row">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            Rows per page
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm" className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm tabular-nums">
              {firstRow} - {lastRow} of {rows.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setPageIndex(page - 1);
                }}
                disabled={page === 0}
              >
                <span className="sr-only">Previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setPageIndex(page + 1);
                }}
                disabled={page >= pageCount - 1}
              >
                <span className="sr-only">Next page</span>
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
