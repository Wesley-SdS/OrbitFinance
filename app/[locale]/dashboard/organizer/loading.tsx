import { Loader2 } from "lucide-react"

export default function OrganizerLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Carregando organizador...</p>
      </div>
    </div>
  )
}