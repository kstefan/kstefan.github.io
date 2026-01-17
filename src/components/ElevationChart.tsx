import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Mountain, MapPin } from "lucide-react";
import type {GPXData} from "@/lib/gpx-parser";

interface ElevationChartProps {
  gpxFiles: GPXData[];
}

interface ElevationPoint {
  distance: number;
  elevation: number;
  fileIndex: number;
}

interface WaypointMarker {
  distance: number;
  elevation: number;
  name?: string;
}

function trackPointKey(lat: number, lon: number, ele?: number): string {
  return `${lat.toFixed(6)},${lon.toFixed(6)},${ele?.toFixed(1) ?? ""}`;
}

function waypointKey(lat: number, lon: number): string {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

export function ElevationChart({ gpxFiles }: ElevationChartProps) {
  const { elevationData, yDomain } = useMemo(() => {
    const data: ElevationPoint[] = [];
    const trackPoints: { lat: number; lon: number; distance: number; elevation: number }[] = [];
    const seenTrackPoints = new Set<string>();
    let cumulativeDistance = 0;
    let prevPoint: { lat: number; lon: number } | null = null;

    // First pass: collect all unique track points with cumulative distance
    gpxFiles.forEach((gpxFile, fileIndex) => {
      gpxFile.tracks.forEach((track) => {
        for (let i = 0; i < track.length; i++) {
          const point = track[i];
          if (point.ele !== undefined) {
            const key = trackPointKey(point.lat, point.lon, point.ele);
            if (seenTrackPoints.has(key)) continue;
            seenTrackPoints.add(key);

            if (prevPoint) {
              const R = 6371;
              const dLat = ((point.lat - prevPoint.lat) * Math.PI) / 180;
              const dLon = ((point.lon - prevPoint.lon) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((prevPoint.lat * Math.PI) / 180) *
                  Math.cos((point.lat * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              cumulativeDistance += R * c;
            }

            prevPoint = { lat: point.lat, lon: point.lon };

            trackPoints.push({
              lat: point.lat,
              lon: point.lon,
              distance: cumulativeDistance,
              elevation: point.ele,
            });

            data.push({
              distance: cumulativeDistance,
              elevation: point.ele,
              fileIndex,
            });
          }
        }
      });
    });

    // Find unique waypoints and match them to nearest track point
    const markers: WaypointMarker[] = [];
    const seenWaypoints = new Set<string>();
    gpxFiles.forEach((gpxFile) => {
      gpxFile.waypoints.forEach((wpt) => {
        const key = waypointKey(wpt.lat, wpt.lon);
        if (seenWaypoints.has(key)) return;
        seenWaypoints.add(key);

        // If no track points, use waypoint's own elevation and spread them evenly
        if (trackPoints.length === 0) {
          markers.push({
            distance: markers.length,
            elevation: wpt.ele ?? 0,
            name: wpt.name,
          });
          return;
        }

        // Find nearest track point to this waypoint
        let nearestIdx = 0;
        let nearestDist = Infinity;

        trackPoints.forEach((tp, idx) => {
          const dLat = wpt.lat - tp.lat;
          const dLon = wpt.lon - tp.lon;
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = idx;
          }
        });

        const nearestPoint = trackPoints[nearestIdx];
        markers.push({
          distance: nearestPoint.distance,
          elevation: wpt.ele ?? nearestPoint.elevation,
          name: wpt.name,
        });
      });
    });

    // Sample data if too many points
    let sampledData = data;
    if (data.length > 500) {
      const step = Math.ceil(data.length / 500);
      sampledData = data.filter((_, index) => index % step === 0);
    }

    // If no track data but we have waypoints, create chart data from waypoints
    if (sampledData.length === 0 && markers.length > 0) {
      markers.forEach((m) => {
        sampledData.push({
          distance: m.distance,
          elevation: m.elevation,
          fileIndex: 0,
        });
      });
    }

    // Calculate Y domain to include both track and waypoint elevations
    const allElevations = [
      ...sampledData.map(d => d.elevation),
      ...markers.map(m => m.elevation),
    ].filter(e => e !== undefined && !isNaN(e));
    
    const minEle = allElevations.length > 0 ? Math.min(...allElevations) : 0;
    const maxEle = allElevations.length > 0 ? Math.max(...allElevations) : 100;
    const padding = (maxEle - minEle) * 0.15 || 50;

    return { 
      elevationData: sampledData, 
      waypointMarkers: markers,
      yDomain: [Math.floor(minEle - padding), Math.ceil(maxEle + padding)]
    };
  }, [gpxFiles]);

  const stats = useMemo(() => {
    if (elevationData.length === 0) return null;

    const elevations = elevationData.map((d) => d.elevation);
    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);
    const totalDistance = elevationData[elevationData.length - 1]?.distance || 0;

    let gain = 0;
    let loss = 0;
    for (let i = 1; i < elevationData.length; i++) {
      const diff = elevationData[i].elevation - elevationData[i - 1].elevation;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }

    return { minEle, maxEle, totalDistance, gain, loss };
  }, [elevationData]);

  const totalWaypoints = gpxFiles.reduce((sum, f) => sum + f.waypoints.length, 0);

  if (gpxFiles.length === 0 || elevationData.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6 shadow-soft animate-fade-in">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-nature">
          <Mountain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Elevation Profile
          </h3>
          <p className="text-sm text-muted-foreground">
            Combined elevation data from {gpxFiles.length} file{gpxFiles.length > 1 ? "s" : ""}
            {totalWaypoints > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-accent">
                <MapPin className="h-3 w-3" />
                {totalWaypoints} waypoint{totalWaypoints > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="font-display text-lg font-semibold text-foreground">
              {stats.totalDistance.toFixed(1)} km
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Min Elevation</p>
            <p className="font-display text-lg font-semibold text-foreground">
              {stats.minEle.toFixed(0)} m
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Max Elevation</p>
            <p className="font-display text-lg font-semibold text-foreground">
              {stats.maxEle.toFixed(0)} m
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Elevation Gain</p>
            <p className="font-display text-lg font-semibold text-primary">
              +{stats.gain.toFixed(0)} m
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Elevation Loss</p>
            <p className="font-display text-lg font-semibold text-destructive">
              -{stats.loss.toFixed(0)} m
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={elevationData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="distance"
              tickFormatter={(value) => `${value.toFixed(1)}`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: "Distance (km)",
                position: "insideBottom",
                offset: -5,
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(value: any) => `${value}`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: "Elevation (m)",
                angle: -90,
                position: "insideLeft",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ElevationPoint;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                      <p className="text-sm font-medium text-foreground">
                        {data.elevation.toFixed(0)} m
                      </p>
                      <p className="text-xs text-muted-foreground">
                        at {data.distance.toFixed(2)} km
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#elevationGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
