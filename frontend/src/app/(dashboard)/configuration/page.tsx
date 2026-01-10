"use client";

import Link from "next/link";
import { Users, Shield, FileText, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const configSections = [
  {
    title: "Utilisateurs",
    description: "Gérer les comptes utilisateurs et leurs accès",
    href: "/configuration/utilisateurs",
    icon: Users,
  },
  {
    title: "Rôles",
    description: "Configurer les rôles et permissions",
    href: "/configuration/roles",
    icon: Shield,
  },
  {
    title: "Questionnaire",
    description: "Personnaliser le questionnaire médical",
    href: "/configuration/questionnaire",
    icon: FileText,
  },
  {
    title: "Zones",
    description: "Définir les zones de traitement",
    href: "/configuration/zones",
    icon: Target,
  },
];

export default function ConfigurationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">
          Paramètres et configuration du système
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {configSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.description}
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
