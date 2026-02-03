"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, User, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Box } from "@/types";

export default function SelectBoxPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, selectBox } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api.getBoxes(),
  });

  const boxes = (data?.boxes || []).filter((b: Box) => b.is_active);

  const handleSelect = async (box: Box) => {
    if (box.current_user_id && box.current_user_id !== user?.id) return;
    try {
      await selectBox(box.id);
      toast({ title: `${box.nom} selectionne` });
      router.push("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur";
      toast({ variant: "destructive", title: "Erreur", description: message });
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <DoorOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Choisissez votre box</h1>
          <p className="text-muted-foreground">
            Selectionnez le box dans lequel vous allez travailler aujourd'hui
          </p>
        </div>

        {/* Box Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : boxes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucun box disponible. Contactez un administrateur.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boxes.map((box: Box) => {
              const isOccupied = box.current_user_id && box.current_user_id !== user?.id;
              const isMine = box.current_user_id === user?.id;

              return (
                <Card
                  key={box.id}
                  interactive={!isOccupied}
                  className={cn(
                    "transition-all",
                    isOccupied && "opacity-60 cursor-not-allowed",
                    isMine && "ring-2 ring-primary",
                  )}
                >
                  <button
                    onClick={() => handleSelect(box)}
                    disabled={!!isOccupied}
                    className="w-full text-left"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold",
                          isOccupied
                            ? "bg-muted text-muted-foreground"
                            : isMine
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        )}>
                          {box.numero}
                        </div>
                        {isOccupied && <Lock className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <h3 className="font-semibold text-lg">{box.nom}</h3>
                      {isOccupied ? (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>{box.current_user_name}</span>
                        </div>
                      ) : isMine ? (
                        <p className="text-sm text-primary mt-2 font-medium">
                          Votre box actuel
                        </p>
                      ) : (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          Disponible
                        </p>
                      )}
                    </CardContent>
                  </button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Skip option for non-practitioners */}
        {user?.role_nom !== "Praticien" && (
          <div className="text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Passer cette etape
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
