"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ScanLine, X, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  code_carte: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
}

interface SearchHeaderProps {
  className?: string;
  placeholder?: string;
  onScanRequest?: () => void;
}

export function SearchHeader({
  className,
  placeholder = "Rechercher patient, scanner carte...",
  onScanRequest,
}: SearchHeaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  // Search patients
  const searchPatients = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.getPatients({ q: searchQuery, size: 5 });
      setResults(response.patients || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for debounced search
  useEffect(() => {
    searchPatients(debouncedQuery);
  }, [debouncedQuery, searchPatients]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Check for special commands
    if (value.toUpperCase() === "NEW" || value.toUpperCase() === "NOUVEAU") {
      haptics.success();
      router.push("/patients/nouveau?express=true");
      setQuery("");
      setIsFocused(false);
    }
  };

  // Handle result selection
  const handleSelectResult = (patient: SearchResult) => {
    haptics.selection();
    router.push(`/patients/${patient.id}`);
    setQuery("");
    setIsFocused(false);
    setResults([]);
  };

  // Handle scan button
  const handleScan = () => {
    haptics.medium();
    if (onScanRequest) {
      onScanRequest();
    } else {
      router.push("/scanner");
    }
  };

  // Handle new patient
  const handleNewPatient = () => {
    haptics.medium();
    router.push("/patients/nouveau");
    setQuery("");
    setIsFocused(false);
  };

  // Clear search
  const handleClear = () => {
    haptics.light();
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const showResults = isFocused && (results.length > 0 || query.length >= 2);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input Container */}
      <div
        className={cn(
          "flex items-center gap-2 bg-muted/50 rounded-2xl border-2 transition-all duration-200",
          isFocused
            ? "border-primary bg-background shadow-lg"
            : "border-transparent hover:bg-muted/70"
        )}
      >
        {/* Search Icon */}
        <div className="pl-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent py-4 text-base outline-none",
            "placeholder:text-muted-foreground"
          )}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 hover:bg-background/50 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* Scan Button */}
        <button
          type="button"
          onClick={handleScan}
          className={cn(
            "flex items-center justify-center h-12 w-12 mr-1 rounded-xl",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 active:scale-95 transition-all"
          )}
          aria-label="Scanner une carte"
        >
          <ScanLine className="h-5 w-5" />
        </button>
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-2 z-50",
            "bg-background rounded-2xl border shadow-xl",
            "max-h-[60vh] overflow-y-auto",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200"
          )}
        >
          {/* Results List */}
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectResult(patient)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl",
                    "hover:bg-muted/50 active:bg-muted transition-colors",
                    "text-left"
                  )}
                >
                  {/* Avatar */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-semibold text-lg">
                    {patient.prenom?.[0]}
                    {patient.nom?.[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">
                      {patient.prenom} {patient.nom}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {patient.code_carte}
                      {patient.telephone && ` • ${patient.telephone}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 && !isLoading ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Aucun patient trouvé pour "{query}"
              </p>
              <button
                onClick={handleNewPatient}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
                  "bg-primary text-primary-foreground font-medium",
                  "hover:bg-primary/90 active:scale-95 transition-all"
                )}
              >
                <UserPlus className="h-5 w-5" />
                Créer "{query}"
              </button>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="border-t p-2">
            <button
              onClick={handleNewPatient}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl",
                "hover:bg-muted/50 active:bg-muted transition-colors"
              )}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-base">Nouveau Patient</p>
                <p className="text-sm text-muted-foreground">
                  Tapez "NEW" pour création express
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isFocused && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsFocused(false)}
        />
      )}
    </div>
  );
}
