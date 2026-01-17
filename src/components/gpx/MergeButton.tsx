import { GitMerge, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {type GPXData, mergeGPXData, gpxDataToXML } from "@/lib/gpx-parser";
import { cn } from "@/lib/utils";

interface MergeButtonProps {
  gpxFiles: GPXData[];
}

export function MergeButton({ gpxFiles }: MergeButtonProps) {
  const isReady = gpxFiles.length >= 2;

  const handleMerge = () => {
    if (!isReady) return;

    const merged = mergeGPXData(gpxFiles);
    const xml = gpxDataToXML(merged);

    const blob = new Blob([xml], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${merged.name}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full transition-all duration-500",
          isReady
            ? "bg-gradient-nature shadow-glow animate-pulse-soft"
            : "bg-muted"
        )}
      >
        <GitMerge
          className={cn(
            "h-7 w-7 transition-colors duration-300",
            isReady ? "text-primary-foreground" : "text-muted-foreground"
          )}
        />
      </div>

      <Button
        size="lg"
        disabled={!isReady}
        onClick={handleMerge}
        className={cn(
          "gap-2 px-8 font-display font-semibold transition-all duration-300",
          isReady && "bg-gradient-nature hover:opacity-90 shadow-soft"
        )}
      >
        <Download className="h-5 w-5" />
        Merge {gpxFiles.length} Files & Download
      </Button>

      {!isReady && (
        <p className="text-sm text-muted-foreground">
          Upload at least 2 GPX files to merge
        </p>
      )}
    </div>
  );
}
