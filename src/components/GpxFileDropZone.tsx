import { useCallback, useState } from "react";
import { Upload, FileCheck, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {type GPXData, parseGPX, getTotalPoints, getTotalDistance } from "@/lib/gpx-parser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GpxFileDropZoneProps {
  label: string;
  gpxData: GPXData | null;
  onFileLoaded: (data: GPXData) => void;
  onClear: () => void;
  onRemove?: () => void;
}

export function GpxFileDropZone({ label, gpxData, onFileLoaded, onClear, onRemove }: GpxFileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".gpx")) {
        setError("Please upload a GPX file");
        return;
      }

      try {
        const text = await file.text();
        const parsed = parseGPX(text, file.name);
        if (parsed.tracks.length === 0 && parsed.waypoints.length === 0) {
          setError("No tracks or waypoints found in GPX file");
          return;
        }
        onFileLoaded(parsed);
      } catch (err) {
        setError("Failed to parse GPX file");
        console.error(err);
      }
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (gpxData) {
    const totalPoints = getTotalPoints(gpxData);
    const totalDistance = getTotalDistance(gpxData);
    const waypointCount = gpxData.waypoints.length;

    return (
      <Card className="relative p-6 shadow-card animate-scale-in bg-card">
        <div className="absolute top-3 right-3 flex gap-1">
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-nature text-primary-foreground">
            <FileCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <h3 className="mt-1 truncate font-display text-lg font-semibold text-foreground">
              {gpxData.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                {gpxData.tracks.length} track{gpxData.tracks.length !== 1 ? "s" : ""}
              </span>
              {waypointCount > 0 && (
                <span className="rounded-full bg-accent/20 px-3 py-1 text-accent-foreground">
                  {waypointCount} waypoint{waypointCount !== 1 ? "s" : ""}
                </span>
              )}
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                {totalPoints.toLocaleString()} points
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                {totalDistance.toFixed(2)} km
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-45 rounded-xl border-2 border-dashed p-8 transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/5 shadow-glow"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {onRemove && !gpxData && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <input
        type="file"
        accept=".gpx"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={handleInputChange}
      />
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300",
            isDragging ? "bg-gradient-nature text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}
        >
          <Upload className="h-6 w-6" />
        </div>
        <p className="mt-4 font-display font-medium text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag & drop or click to browse
        </p>
        {error && (
          <p className="mt-3 text-sm font-medium text-destructive animate-fade-in">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
