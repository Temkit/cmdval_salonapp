import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  User,
  Camera,
  MessageSquare,
  Send,
  Zap,
  Image,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/practitioner/sessions/$id")({
  component: PractitionerSessionDetailPage,
});

function formatDuration(minutes: number | null): string {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function PractitionerSessionDetailPage() {
  const { id } = Route.useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: () => api.getSession(id),
  });

  const notesMutation = useMutation({
    mutationFn: (notes: string) => api.updateSessionNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      setNoteText("");
      setShowNoteForm(false);
      toast({ title: "Commentaire ajoute" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => api.addSessionPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      toast({ title: "Photo ajoutee" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur photo", description: err.message });
    },
  });

  const handleAddNote = () => {
    if (!noteText.trim() || !session) return;
    const existingNotes = session.notes || "";
    const newNotes = existingNotes
      ? `${existingNotes}\n${noteText.trim()}`
      : noteText.trim();
    notesMutation.mutate(newNotes);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    photoMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground">Seance non trouvee</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/practitioner/mes-seances">Retour</Link>
        </Button>
      </div>
    );
  }

  const notes = session.notes?.split("\n").filter(Boolean) || [];

  return (
    <div className="page-container space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/practitioner/mes-seances">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="heading-2">Seance</h1>
          <p className="text-sm text-muted-foreground">
            {session.patient_prenom} {session.patient_nom} - {session.zone_nom}
          </p>
        </div>
      </div>

      {/* Session summary card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Resume de la seance</CardTitle>
            <Badge variant="secondary">{session.type_laser}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{session.patient_prenom} {session.patient_nom}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              <span>Dr. {session.praticien_nom}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(session.date_seance)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDuration(session.duree_minutes)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Parametres laser
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {session.type_laser}
              </Badge>
              {session.spot_size && (
                <Badge variant="outline">{session.spot_size} mm</Badge>
              )}
              {session.fluence && (
                <Badge variant="outline">{session.fluence} J/cm²</Badge>
              )}
              {session.pulse_duration_ms && (
                <Badge variant="outline">{session.pulse_duration_ms} ms</Badge>
              )}
              {session.frequency_hz && (
                <Badge variant="outline">{session.frequency_hz} Hz</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" />
              Photos ({session.photos.length})
            </CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoMutation.isPending}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                {photoMutation.isPending ? "Envoi..." : "Ajouter"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {session.photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {session.photos.map((photo) => (
                <button
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelectedPhoto(photo.url)}
                >
                  <img
                    src={photo.url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune photo pour cette seance
            </p>
          )}
        </CardContent>
      </Card>

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-white/80"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedPhoto}
            alt="Photo seance"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Notes / Comments section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Commentaires
            </CardTitle>
            {!showNoteForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNoteForm(true)}
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.map((note, i) => (
                <div
                  key={i}
                  className="p-3 bg-muted/50 rounded-lg text-sm"
                >
                  {note}
                </div>
              ))}
            </div>
          ) : !showNoteForm ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aucun commentaire
            </p>
          ) : null}

          {showNoteForm && (
            <div className="space-y-2">
              <Textarea
                placeholder="Ecrire un commentaire..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNoteText("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || notesMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {notesMutation.isPending ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
