import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, FileText, ShieldCheck, UserPlus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientWorkflowStepper } from "@/components/patient-workflow";

export const Route = createFileRoute("/admin/patients/nouveau")({
  component: AdminPatientNouveauPage,
});

const WORKFLOW_STEPS = [
  {
    icon: FileText,
    title: "Pre-consultation",
    desc: "Remplissez le formulaire medical : informations du patient, antecedents, zones a traiter.",
    active: true,
  },
  {
    icon: ShieldCheck,
    title: "Validation",
    desc: "Un responsable examine et valide la pre-consultation.",
    active: false,
  },
  {
    icon: UserPlus,
    title: "Dossier patient",
    desc: "Une fois validee, le dossier patient est cree avec les zones eligibles.",
    active: false,
  },
  {
    icon: Zap,
    title: "Seances laser",
    desc: "Les seances sont planifiees pour chaque zone selectionnee.",
    active: false,
  },
];

function AdminPatientNouveauPage() {
  return (
    <div className="page-container space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link to="/admin/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="heading-2">Nouveau patient</h1>
      </div>

      {/* Stepper */}
      <PatientWorkflowStepper current="preconsult" />

      {/* Explanation */}
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Chez Optiskin, chaque nouveau patient passe par un parcours en 4 etapes
            pour garantir sa securite et son eligibilite au traitement laser.
          </p>

          <div className="space-y-4">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      step.active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-semibold ${step.active ? "text-primary" : ""}`}>
                      {i + 1}. {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button asChild size="lg" className="w-full">
        <a href="/admin/pre-consultations/nouveau?from=nouveau-patient">
          Commencer la pre-consultation
          <ArrowRight className="h-4 w-4 ml-2" />
        </a>
      </Button>
    </div>
  );
}
