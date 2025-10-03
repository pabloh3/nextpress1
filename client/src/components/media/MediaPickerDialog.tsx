import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Film, Music, File } from "lucide-react";
import type { Media } from "@shared/schema";

type MediaKind = "any" | "image" | "video" | "audio";

export interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: Media) => void;
  kind?: MediaKind;
}

export default function MediaPickerDialog({ open, onOpenChange, onSelect, kind = "any" }: MediaPickerDialogProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/media", { per_page: 100, page: 1 }],
  });

  const items: Media[] = (data as any)?.media || [];

  const filtered = useMemo(() => {
    const matchesKind = (m: Media) => {
      if (kind === "any") return true;
      return m.mimeType?.startsWith(kind + "/");
    };
    const matchesSearch = (m: Media) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.originalName?.toLowerCase().includes(q) ||
        m.filename?.toLowerCase().includes(q) ||
        m.alt?.toLowerCase().includes(q) ||
        m.caption?.toLowerCase().includes(q) ||
        m.mimeType?.toLowerCase().includes(q)
      );
    };
    return items.filter((m) => matchesKind(m) && matchesSearch(m));
  }, [items, kind, search]);

  const renderThumb = (m: Media) => {
    if (m.mimeType?.startsWith("image/")) {
      return (
        <img
          src={m.url}
          alt={m.alt || m.originalName || m.filename}
          className="w-full h-28 object-cover rounded"
        />
      );
    }
    const Icon = m.mimeType?.startsWith("video/")
      ? Film
      : m.mimeType?.startsWith("audio/")
      ? Music
      : File;
    return (
      <div className="w-full h-28 flex items-center justify-center bg-muted rounded">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select media</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${filtered.length} item${filtered.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <ScrollArea className="mt-4 h-96">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-2">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                className="group text-left border rounded hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                onClick={() => {
                  onSelect(m);
                  onOpenChange(false);
                }}
              >
                <div className="relative">{renderThumb(m)}</div>
                <div className="p-2">
                  <div className="text-sm font-medium truncate" title={m.originalName || m.filename}>
                    {m.originalName || m.filename}
                  </div>
                  <div className="text-xs text-muted-foreground truncate" title={m.mimeType}>
                    {m.mimeType}
                  </div>
                </div>
              </button>
            ))}
            {!isLoading && filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                <div>No media found</div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


