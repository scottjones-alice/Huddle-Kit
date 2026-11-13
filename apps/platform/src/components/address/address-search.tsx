"use client";

import { Input } from "@alice/user-interface/components/input";
import { useEffect, useId, useRef, useState } from "react";

import type { AddressValues } from "@/lib/address";
import { addressForSuggestion, searchAddresses } from "@/lib/address-lookup";
import type { AddressSuggestion, SuggestionResult } from "@/lib/address-lookup";

const SEARCH_DELAY_MS = 300;
const MIN_QUERY_LENGTH = 3;

/** Searches, and hands over the result unless the search was cancelled meanwhile. */
const runSearch = async (
  query: string,
  signal: AbortSignal,
  apply: (result: SuggestionResult) => void
): Promise<void> => {
  const result = await searchAddresses(query, signal);
  if (!signal.aborted) {
    apply(result);
  }
};

interface AddressSearchProps {
  // Called with the address parts for the suggestion the person picked.
  onPick: (address: Partial<AddressValues>) => void;
}

/**
 * Type part of an address and pick it from the list to fill in the fields.
 * It shows nothing when address search is not set up, so people just type.
 */
export function AddressSearch({ onPick }: AddressSearchProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const justPicked = useRef(false);

  // Find out once whether address search is set up, so the box only shows then.
  useEffect(() => {
    const controller = new AbortController();
    const probe = async () => {
      const result = await searchAddresses("", controller.signal);
      if (!controller.signal.aborted) {
        setEnabled(result.enabled);
      }
    };
    void probe();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const skip = justPicked.current || query.trim().length < MIN_QUERY_LENGTH;
    justPicked.current = false;
    const timer = setTimeout(() => {
      if (!skip) {
        void runSearch(query.trim(), controller.signal, (result) => {
          setEnabled(result.enabled);
          setSuggestions(result.suggestions);
        });
      }
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!enabled) {
    return null;
  }

  const handlePick = async (suggestion: AddressSuggestion) => {
    justPicked.current = true;
    setSuggestions([]);
    setQuery(suggestion.text);
    const address = await addressForSuggestion(suggestion.id);
    if (address !== null) {
      onPick(address);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={`${listId}-search`}>
        Find an address
      </label>
      <Input
        id={`${listId}-search`}
        autoComplete="off"
        placeholder="Start typing a street or postcode"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
        onKeyDown={(event) => {
          // Enter must not submit the wizard step while searching.
          if (event.key === "Enter") {
            event.preventDefault();
          }
        }}
      />
      {suggestions.length > 0 ? (
        <ul
          id={listId}
          aria-label="Matching addresses"
          className="border-input divide-y rounded-2xl border"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="hover:bg-input/40 w-full px-4 py-2.5 text-start text-sm"
                onClick={() => {
                  void handlePick(suggestion);
                }}
              >
                {suggestion.text}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-muted-foreground text-xs">
        Or fill in the address yourself below.
      </p>
    </div>
  );
}
