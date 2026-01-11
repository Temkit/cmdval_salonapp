"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ClipboardList, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPatientPage() {
  const router = useRouter();

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/pre-consultations/nouveau");
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="text-center pb-3">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Pre-consultation requise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Workflow Optiskin
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Avant de creer un patient, le medecin doit d'abord effectuer une
                pre-consultation pour evaluer l'eligibilite au laser.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 space-y-2">
            <p className="font-semibold text-sm">Etapes du processus:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground ml-1">
              <li>Pre-consultation par le medecin</li>
              <li>Validation de l'eligibilite</li>
              <li>Creation du patient par la receptionniste</li>
              <li>Seances de laser</li>
            </ol>
          </div>

          <Button asChild className="w-full h-12" size="lg">
            <Link href="/pre-consultations/nouveau">
              <ClipboardList className="h-5 w-5 mr-2" />
              Nouvelle pre-consultation
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Redirection automatique dans 5 secondes...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
