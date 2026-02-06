import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  AlertTriangle,
  Plus,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/paiements")({
  component: AdminPaiementsPage,
});

function AdminPaiementsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [addForm, setAddForm] = useState({
    patient_id: "",
    montant: "",
    type_paiement: "encaissement",
    mode_paiement: "especes",
    reference: "",
    notes: "",
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["paiements", typeFilter, dateFrom, dateTo],
    queryFn: () =>
      api.getPaiements({
        type: typeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["patients-search", patientSearch],
    queryFn: () => api.getPatients({ q: patientSearch, size: 5 }),
    enabled: patientSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPaiement({
        patient_id: addForm.patient_id,
        montant: parseFloat(addForm.montant),
        type: addForm.type_paiement as any,
        mode_paiement: addForm.mode_paiement as any,
        reference: addForm.reference || undefined,
        notes: addForm.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paiements"] });
      toast({ title: "Paiement enregistre" });
      setAddDialogOpen(false);
      setAddForm({
        patient_id: "",
        montant: "",
        type_paiement: "encaissement",
        mode_paiement: "especes",
        reference: "",
        notes: "",
      });
      setPatientSearch("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const paiements = data?.paiements || [];
  const typeFilters = [
    { value: "", label: "Tous" },
    { value: "encaissement", label: "Encaissement" },
    { value: "prise_en_charge", label: "Prise en charge" },
    { value: "hors_carte", label: "Hors carte" },
  ];

  const paymentTypes = [
    { value: "encaissement", label: "Encaissement" },
    { value: "prise_en_charge", label: "Prise en charge" },
    { value: "hors_carte", label: "Hors carte" },
  ];

  const paymentModes = [
    { value: "especes", label: "Especes" },
    { value: "carte", label: "Carte" },
    { value: "virement", label: "Virement" },
  ];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Paiements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historique et suivi des paiements
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau paiement
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map((f) => (
              <Button
                key={f.value}
                variant={typeFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="max-w-[160px]"
              placeholder="Du"
            />
            <span className="text-sm text-muted-foreground">au</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="max-w-[160px]"
              placeholder="Au"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments list */}
      {isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(error as Error)?.message || "Impossible de charger les paiements"}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Reessayer
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 skeleton rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 skeleton rounded" />
                    <div className="h-4 w-24 skeleton rounded" />
                  </div>
                  <div className="h-6 w-20 skeleton rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paiements.length > 0 ? (
        <div className="space-y-3">
          {paiements.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {p.patient_prenom} {p.patient_nom}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.date_paiement && formatDate(p.date_paiement)}
                        {p.reference && ` - Ref: ${p.reference}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-bold text-sm">
                        {p.montant?.toLocaleString()} DA
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {p.type && (
                        <Badge variant="secondary">{p.type}</Badge>
                      )}
                      {p.mode_paiement && (
                        <Badge variant="outline">{p.mode_paiement}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      ) : (
        <EmptyState
          icon={CreditCard}
          title="Aucun paiement"
          description="Les paiements apparaitront ici"
          action={{
            label: "Nouveau paiement",
            onClick: () => setAddDialogOpen(true),
          }}
        />
      )}

      {/* Add payment dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            {/* Patient search */}
            <div className="space-y-2">
              <Label>Patient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un patient..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setAddForm((f) => ({ ...f, patient_id: "" }));
                  }}
                  className="pl-9"
                />
              </div>
              {searchResults?.patients?.length && !addForm.patient_id ? (
                <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                  {searchResults.patients.map(
                    (p: { id: string; prenom?: string; nom?: string }) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => {
                          setAddForm((f) => ({ ...f, patient_id: p.id }));
                          setPatientSearch(`${p.prenom} ${p.nom}`);
                        }}
                      >
                        {p.prenom} {p.nom}
                      </button>
                    )
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Montant (DA)</Label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={addForm.montant}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, montant: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="space-y-1">
                  {paymentTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() =>
                        setAddForm((f) => ({
                          ...f,
                          type_paiement: t.value,
                        }))
                      }
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                        addForm.type_paiement === t.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <div className="space-y-1">
                  {paymentModes.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() =>
                        setAddForm((f) => ({
                          ...f,
                          mode_paiement: m.value,
                        }))
                      }
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                        addForm.mode_paiement === m.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reference (optionnel)</Label>
              <Input
                value={addForm.reference}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, reference: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Input
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  !addForm.patient_id ||
                  !addForm.montant ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
