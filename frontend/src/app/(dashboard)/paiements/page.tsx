"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet, Search, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Paiement, PaiementType, ModePaiement, Patient, CreatePaiementRequest } from "@/types";

const TYPE_LABELS: Record<PaiementType, string> = {
  encaissement: "Encaissement",
  prise_en_charge: "Prise en charge",
  hors_carte: "Hors carte",
};

const MODE_LABELS: Record<ModePaiement, string> = {
  especes: "Espèces",
  carte: "Carte",
  virement: "Virement",
};

export default function PaiementsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [payForm, setPayForm] = useState({
    patient_id: "",
    montant: "",
    type: "encaissement" as PaiementType,
    mode_paiement: "especes" as ModePaiement,
    reference: "",
    notes: "",
  });

  const { data: revenueStats } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: () => api.getRevenueStats(),
  });

  const { data: paiementsData, isLoading } = useQuery({
    queryKey: ["paiements", typeFilter, dateFrom, dateTo],
    queryFn: () =>
      api.getPaiements({
        type: typeFilter !== "all" ? typeFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients-search", patientSearch],
    queryFn: () => api.getPatients({ q: patientSearch, size: 10 }),
    enabled: patientSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePaiementRequest) => api.createPaiement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paiements"] });
      queryClient.invalidateQueries({ queryKey: ["revenue-stats"] });
      toast({ title: "Paiement enregistré" });
      setDialogOpen(false);
      setPayForm({ patient_id: "", montant: "", type: "encaissement", mode_paiement: "especes", reference: "", notes: "" });
      setPatientSearch("");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.patient_id) {
      toast({ variant: "destructive", title: "Erreur", description: "Sélectionnez un patient" });
      return;
    }
    createMutation.mutate({
      patient_id: payForm.patient_id,
      montant: parseFloat(payForm.montant) || 0,
      type: payForm.type,
      mode_paiement: payForm.mode_paiement,
      reference: payForm.reference || undefined,
      notes: payForm.notes || undefined,
    });
  };

  const paiements = paiementsData?.paiements || [];
  const totalRevenue = revenueStats?.total_revenue || 0;
  const totalPayments = revenueStats?.total_payments || 0;
  const byType = revenueStats?.by_type || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2">Paiements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des paiements et facturation
          </p>
        </div>
        <Button onClick={() => { setPayForm({ patient_id: "", montant: "", type: "encaissement", mode_paiement: "especes", reference: "", notes: "" }); setPatientSearch(""); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau paiement
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenu total"
          value={`${totalRevenue.toLocaleString()} DA`}
          description={`${totalPayments} paiements`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        {byType.slice(0, 3).map((item) => (
          <StatCard
            key={item.type}
            title={TYPE_LABELS[item.type as PaiementType] || item.type}
            value={`${item.total.toLocaleString()} DA`}
            description={`${item.count} paiements`}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="encaissement">Encaissement</SelectItem>
                <SelectItem value="prise_en_charge">Prise en charge</SelectItem>
                <SelectItem value="hors_carte">Hors carte</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
              placeholder="Date début"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
              placeholder="Date fin"
            />
            {(typeFilter !== "all" || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}>
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-xl">
                  <div className="h-10 w-10 skeleton rounded-xl" />
                  <div className="flex-1 space-y-1">
                    <div className="h-5 w-32 skeleton rounded" />
                    <div className="h-4 w-24 skeleton rounded" />
                  </div>
                  <div className="h-6 w-20 skeleton rounded-full" />
                </div>
              ))}
            </div>
          ) : paiements.length > 0 ? (
            <div className="space-y-2">
              {paiements.map((pay: Paiement) => (
                <div key={pay.id} className="flex items-center gap-4 p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {pay.patient_prenom} {pay.patient_nom}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(pay.date_paiement)}
                      {pay.reference && ` - Réf: ${pay.reference}`}
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">{pay.montant.toLocaleString()} DA</p>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant="secondary" size="sm">
                      {TYPE_LABELS[pay.type] || pay.type}
                    </Badge>
                    {pay.mode_paiement && (
                      <Badge variant="outline" size="sm">
                        {MODE_LABELS[pay.mode_paiement] || pay.mode_paiement}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Wallet}
              title="Aucun paiement"
              description="Les paiements apparaîtront ici une fois enregistrés"
              action={{ label: "Nouveau paiement", onClick: () => setDialogOpen(true) }}
            />
          )}
        </CardContent>
      </Card>

      {/* New Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nouveau paiement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Input
                  placeholder="Rechercher un patient..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setPayForm((p) => ({ ...p, patient_id: "" })); }}
                />
                {patientsData?.patients && patientsData.patients.length > 0 && !payForm.patient_id && (
                  <div className="border rounded-lg max-h-32 overflow-y-auto">
                    {patientsData.patients.map((p: Patient) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm transition-colors"
                        onClick={() => { setPayForm((prev) => ({ ...prev, patient_id: p.id })); setPatientSearch(`${p.prenom} ${p.nom}`); }}
                      >
                        {p.prenom} {p.nom} <span className="text-muted-foreground">({p.code_carte})</span>
                      </button>
                    ))}
                  </div>
                )}
                {payForm.patient_id && (
                  <Badge variant="success" size="sm">Patient sélectionné</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Montant (DA)</Label>
                <Input type="number" min="0" value={payForm.montant} onChange={(e) => setPayForm((p) => ({ ...p, montant: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={payForm.type} onValueChange={(v) => setPayForm((p) => ({ ...p, type: v as PaiementType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encaissement">Encaissement</SelectItem>
                      <SelectItem value="prise_en_charge">Prise en charge</SelectItem>
                      <SelectItem value="hors_carte">Hors carte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select value={payForm.mode_paiement} onValueChange={(v) => setPayForm((p) => ({ ...p, mode_paiement: v as ModePaiement }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="carte">Carte</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Référence (optionnel)</Label>
                <Input value={payForm.reference} onChange={(e) => setPayForm((p) => ({ ...p, reference: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea value={payForm.notes} onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
