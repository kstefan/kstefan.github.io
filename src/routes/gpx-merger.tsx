import {createFileRoute} from '@tanstack/react-router'
import {Map, Mountain, Plus} from "lucide-react";
import {FileDropZone} from "@/components/gpx/FileDropZone.tsx";
import {useState} from "react";
import type {GPXData} from "@/lib/gpx-parser.ts";
import {MergeButton} from "@/components/gpx/MergeButton.tsx";
import {ElevationChart} from "@/components/gpx/ElevationChart.tsx";

export const Route = createFileRoute('/gpx-merger')({
    component: RouteComponent,
})


function RouteComponent() {
    const [gpxFiles, setGpxFiles] = useState<(GPXData | null)[]>([null, null]);

    const handleFileLoaded = (index: number, data: GPXData) => {
        setGpxFiles((prev) => {
            const updated = [...prev];
            updated[index] = data;
            return updated;
        });
    };

    const handleClear = (index: number) => {
        setGpxFiles((prev) => {
            const updated = [...prev];
            updated[index] = null;
            return updated;
        });
    };

    const handleAddSlot = () => {
        setGpxFiles((prev) => [...prev, null]);
    };

    const handleRemoveSlot = (index: number) => {
        if (gpxFiles.length <= 2) return;
        setGpxFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const loadedFiles = gpxFiles.filter((f): f is GPXData => f !== null);


    return <div className="min-h-screen bg-gradient-subtle">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="container flex h-16 items-center gap-3 px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-nature">
                    <Map className="h-5 w-5 text-primary-foreground"/>
                </div>
                <span className="font-display text-xl font-bold text-foreground">
            GPX Merger
          </span>
            </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-12">
            <div className="mx-auto max-w-4xl">
                {/* Hero Section */}
                <div className="mb-12 text-center animate-fade-in">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-nature shadow-glow">
                        <Mountain className="h-10 w-10 text-primary-foreground"/>
                    </div>
                    <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Merge Your
                        <span className="text-gradient"> GPX Tracks</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
                        Combine multiple GPS tracks into a single file. Perfect for multi-day adventures or connecting routes.
                    </p>
                </div>

                {/* Upload Section */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{animationDelay: "0.1s"}}>
                    {gpxFiles.map((gpxData, index) => (
                        <FileDropZone
                            key={index}
                            label={`GPX File ${index + 1}`}
                            gpxData={gpxData}
                            onFileLoaded={(data) => handleFileLoaded(index, data)}
                            onClear={() => handleClear(index)}
                            onRemove={gpxFiles.length > 2 ? () => handleRemoveSlot(index) : undefined}
                        />
                    ))}

                    {/* Add More Button */}
                    <button
                        onClick={handleAddSlot}
                        className="flex min-h-45 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 p-6 text-muted-foreground transition-all hover:border-primary/50 hover:bg-muted/50 hover:text-foreground"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                            <Plus className="h-6 w-6"/>
                        </div>
                        <span className="font-medium">Add More Files</span>
                    </button>
                </div>

                {/* Merge Section */}
                <div className="mt-12 flex justify-center animate-fade-in" style={{animationDelay: "0.2s"}}>
                    <MergeButton gpxFiles={loadedFiles}/>
                </div>

                {/* Elevation Chart */}
                {loadedFiles.length > 0 && (
                    <div className="animate-fade-in" style={{animationDelay: "0.25s"}}>
                        <ElevationChart gpxFiles={loadedFiles}/>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-16 rounded-2xl border border-border/50 bg-card p-8 shadow-soft animate-fade-in"
                     style={{animationDelay: "0.3s"}}>
                    <h2 className="font-display text-lg font-semibold text-foreground">
                        How it works
                    </h2>
                    <ul className="mt-4 space-y-3 text-muted-foreground">
                        <li className="flex items-start gap-3">
                <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                            <span>Upload GPX files by dragging them or clicking the upload areas</span>
                        </li>
                        <li className="flex items-start gap-3">
                <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                            <span>Add more slots if you need to merge more than 2 files</span>
                        </li>
                        <li className="flex items-start gap-3">
                <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                            <span>Click merge to combine all tracks and waypoints into a single GPX file</span>
                        </li>
                    </ul>
                </div>
            </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/50 py-8">
            <div className="container px-4 text-center text-sm text-muted-foreground">
                <p>All processing happens locally in your browser. Your files never leave your device.</p>
            </div>
        </footer>
    </div>
}
