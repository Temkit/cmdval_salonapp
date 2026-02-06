import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DoorOpen, Lock, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practitioner/select-box")({
  component: SelectBoxPage,
});

function SelectBoxPage() {
  const navigate = useNavigate();
  const { user, selectBox } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => api.getBoxes(),
  });

  const assignMutation = useMutation({
    mutationFn: async (boxId: string) => {
      await selectBox(boxId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes"] });
      toast({ title: "Cabine selectionnee" });
      navigate({ to: "/practitioner" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const boxes = data?.boxes ?? [];

  return (
    <div className="page-container space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <DoorOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="heading-2">Choisir une cabine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selectionnez la cabine dans laquelle vous allez travailler
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : boxes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {boxes.map((box) => {
            const isCurrentUser = box.current_user_id === user?.id;
            const isOccupied = !!box.current_user_id && !isCurrentUser;

            return (
              <Card
                key={box.id}
                interactive={!isOccupied}
                className={cn(
                  isCurrentUser && "ring-2 ring-primary",
                  isOccupied && "opacity-60",
                )}
                onClick={() => {
                  if (!isOccupied && !assignMutation.isPending) {
                    assignMutation.mutate(box.id);
                  }
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                        {box.numero}
                      </Badge>
                      <span className="font-medium">{box.nom}</span>
                    </div>
                    {isOccupied && <Lock className="h-4 w-4 text-muted-foreground" />}
                    {isCurrentUser && <Check className="h-5 w-5 text-primary" />}
                  </div>
                  {isCurrentUser ? (
                    <Badge variant="success" dot>Votre cabine</Badge>
                  ) : isOccupied ? (
                    <span className="text-sm text-muted-foreground">{box.current_user_name}</span>
                  ) : (
                    <Badge variant="success" dot>Disponible</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Aucune cabine configuree</p>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/practitioner" })}
        >
          Passer cette etape
        </Button>
      </div>
    </div>
  );
}
