"use client";

import Link from "next/link";
import { Users, Shield, FileText, Target, ChevronRight, Settings, Package, Tag, DoorOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const configSections = [
  {
    title: "Utilisateurs",
    description: "Gérer les comptes utilisateurs et leurs accès",
    href: "/configuration/utilisateurs",
    icon: Users,
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Rôles & Permissions",
    description: "Configurer les rôles et leurs permissions d'accès",
    href: "/configuration/roles",
    icon: Shield,
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  },
  {
    title: "Questionnaire",
    description: "Personnaliser les questions du questionnaire médical",
    href: "/configuration/questionnaire",
    icon: FileText,
    color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  },
  {
    title: "Zones de traitement",
    description: "Définir les zones disponibles pour les traitements",
    href: "/configuration/zones",
    icon: Target,
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Boxes",
    description: "Gérer les salles de traitement",
    href: "/configuration/boxes",
    icon: DoorOpen,
    color: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
  },
  {
    title: "Packs",
    description: "Gérer les packs de séances et abonnements",
    href: "/configuration/packs",
    icon: Package,
    color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Promotions",
    description: "Configurer les promotions et réductions sur les zones",
    href: "/configuration/promotions",
    icon: Tag,
    color: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  },
];

export default function ConfigurationPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="heading-2">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parametres et configuration du systeme
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {configSections.map((section) => (
          <Card key={section.href} interactive>
            <Link href={section.href}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                    section.color
                  )}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* App Info */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-lg">SA</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">SalonApp</h3>
              <p className="text-sm text-muted-foreground">
                Gestion de salon d'épilation laser
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium">v1.0.0</p>
              <p className="text-xs text-muted-foreground">Build 2024.01</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
