export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

export interface Waypoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

export interface GPXData {
  name: string;
  tracks: TrackPoint[][];
  waypoints: Waypoint[];
  metadata?: {
    name?: string;
    desc?: string;
    author?: string;
    time?: string;
  };
}

export function parseGPX(xmlString: string, fileName: string): GPXData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const tracks: TrackPoint[][] = [];
  const waypoints: Waypoint[] = [];

  // Parse metadata
  const metadataEl = xmlDoc.querySelector("metadata");
  const metadata: GPXData["metadata"] = {};
  if (metadataEl) {
    metadata.name = metadataEl.querySelector("name")?.textContent || undefined;
    metadata.desc = metadataEl.querySelector("desc")?.textContent || undefined;
    metadata.time = metadataEl.querySelector("time")?.textContent || undefined;
  }

  // Parse tracks
  const trkElements = xmlDoc.querySelectorAll("trk");
  trkElements.forEach((trk) => {
    const trksegs = trk.querySelectorAll("trkseg");
    trksegs.forEach((trkseg) => {
      const points: TrackPoint[] = [];
      const trkpts = trkseg.querySelectorAll("trkpt");
      trkpts.forEach((trkpt) => {
        const lat = parseFloat(trkpt.getAttribute("lat") || "0");
        const lon = parseFloat(trkpt.getAttribute("lon") || "0");
        const ele = trkpt.querySelector("ele")?.textContent;
        const time = trkpt.querySelector("time")?.textContent;
        points.push({
          lat,
          lon,
          ele: ele ? parseFloat(ele) : undefined,
          time: time || undefined,
        });
      });
      if (points.length > 0) {
        tracks.push(points);
      }
    });
  });

  // Parse waypoints - use getElementsByTagName for namespace compatibility
  const wptElements = xmlDoc.getElementsByTagName("wpt");
  Array.from(wptElements).forEach((wpt) => {
    const lat = parseFloat(wpt.getAttribute("lat") || "0");
    const lon = parseFloat(wpt.getAttribute("lon") || "0");
    const eleEl = wpt.getElementsByTagName("ele")[0];
    const nameEl = wpt.getElementsByTagName("name")[0];
    const ele = eleEl?.textContent;
    const name = nameEl?.textContent;
    waypoints.push({
      lat,
      lon,
      ele: ele ? parseFloat(ele) : undefined,
      name: name || undefined,
    });
  });

  return {
    name: metadata.name || fileName.replace(".gpx", ""),
    tracks,
    waypoints,
    metadata,
  };
}

function trackPointKey(pt: TrackPoint): string {
  return `${pt.lat.toFixed(6)},${pt.lon.toFixed(6)},${pt.ele?.toFixed(1) ?? ""},${pt.time ?? ""}`;
}

function waypointKey(wpt: Waypoint): string {
  return `${wpt.lat.toFixed(5)},${wpt.lon.toFixed(5)}`;
}

function deduplicateTrack(track: TrackPoint[]): TrackPoint[] {
  const seen = new Set<string>();
  return track.filter((pt) => {
    const key = trackPointKey(pt);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateWaypoints(waypoints: Waypoint[]): Waypoint[] {
  const seen = new Set<string>();
  return waypoints.filter((wpt) => {
    const key = waypointKey(wpt);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mergeGPXData(gpxFiles: GPXData[]): GPXData {
  if (gpxFiles.length === 0) {
    return { name: "empty", tracks: [], waypoints: [] };
  }
  if (gpxFiles.length === 1) {
    return gpxFiles[0];
  }

  // Merge all tracks into one and deduplicate points
  const allPoints = gpxFiles.flatMap((gpx) => gpx.tracks.flat());
  const uniquePoints = deduplicateTrack(allPoints);
  
  // Deduplicate waypoints
  const allWaypoints = gpxFiles.flatMap((gpx) => gpx.waypoints);
  const uniqueWaypoints = deduplicateWaypoints(allWaypoints);
  
  const names = gpxFiles.map((gpx) => gpx.name).join(" + ");

  return {
    name: `merged_${gpxFiles.length}_files`,
    tracks: uniquePoints.length > 0 ? [uniquePoints] : [],
    waypoints: uniqueWaypoints,
    metadata: {
      name: `Merged: ${names}`,
      desc: `Merged GPX file from ${gpxFiles.length} files`,
      time: new Date().toISOString(),
    },
  };
}

export function gpxDataToXML(gpxData: GPXData): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Merger" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${gpxData.metadata?.name || gpxData.name}</name>
    <desc>${gpxData.metadata?.desc || ""}</desc>
    <time>${gpxData.metadata?.time || new Date().toISOString()}</time>
  </metadata>`;

  // Add waypoints
  gpxData.waypoints.forEach((wpt) => {
    xml += `
  <wpt lat="${wpt.lat}" lon="${wpt.lon}">`;
    if (wpt.ele !== undefined) {
      xml += `
    <ele>${wpt.ele}</ele>`;
    }
    xml += `
  </wpt>`;
  });

  // Add tracks
  gpxData.tracks.forEach((track, index) => {
    xml += `
  <trk>
    <name>Track ${index + 1}</name>
    <trkseg>`;
    track.forEach((pt) => {
      xml += `
      <trkpt lat="${pt.lat}" lon="${pt.lon}">`;
      if (pt.ele !== undefined) {
        xml += `
        <ele>${pt.ele}</ele>`;
      }
      if (pt.time) {
        xml += `
        <time>${pt.time}</time>`;
      }
      xml += `
      </trkpt>`;
    });
    xml += `
    </trkseg>
  </trk>`;
  });

  xml += `
</gpx>`;

  return xml;
}

export function calculateDistance(points: TrackPoint[]): number {
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    distance += haversineDistance(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );
  }
  return distance;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getTotalPoints(gpxData: GPXData): number {
  return gpxData.tracks.reduce((sum, track) => sum + track.length, 0);
}

export function getTotalDistance(gpxData: GPXData): number {
  return gpxData.tracks.reduce(
    (sum, track) => sum + calculateDistance(track),
    0
  );
}
