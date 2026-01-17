import { describe, it, expect } from "vitest";
import {
  parseGPX,
  mergeGPXData,
  gpxDataToXML,
  calculateDistance,
  getTotalPoints,
  getTotalDistance,
  GPXData,
  TrackPoint,
} from "./gpx-parser";

describe("gpx-parser", () => {
  describe("parseGPX", () => {
    it("should parse a simple GPX file with one track", () => {
      const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1">
          <metadata>
            <name>Test Track</name>
            <desc>A test description</desc>
          </metadata>
          <trk>
            <trkseg>
              <trkpt lat="50.0" lon="14.0">
                <ele>200</ele>
                <time>2024-01-01T10:00:00Z</time>
              </trkpt>
              <trkpt lat="50.1" lon="14.1">
                <ele>250</ele>
              </trkpt>
            </trkseg>
          </trk>
        </gpx>`;

      const result = parseGPX(gpxXml, "test.gpx");

      expect(result.name).toBe("Test Track");
      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0]).toHaveLength(2);
      expect(result.tracks[0][0]).toEqual({
        lat: 50.0,
        lon: 14.0,
        ele: 200,
        time: "2024-01-01T10:00:00Z",
      });
      expect(result.tracks[0][1]).toEqual({
        lat: 50.1,
        lon: 14.1,
        ele: 250,
        time: undefined,
      });
    });

    it("should use filename when metadata name is missing", () => {
      const gpxXml = `<?xml version="1.0"?><gpx><trk><trkseg></trkseg></trk></gpx>`;
      const result = parseGPX(gpxXml, "my-route.gpx");
      expect(result.name).toBe("my-route");
    });

    it("should parse waypoints", () => {
      const gpxXml = `<?xml version="1.0"?>
        <gpx>
          <wpt lat="50.5" lon="14.5">
            <ele>300</ele>
            <name>Summit</name>
          </wpt>
        </gpx>`;

      const result = parseGPX(gpxXml, "waypoints.gpx");

      expect(result.waypoints).toHaveLength(1);
      expect(result.waypoints[0]).toEqual({
        lat: 50.5,
        lon: 14.5,
        ele: 300,
        name: "Summit",
      });
    });

    it("should handle multiple track segments", () => {
      const gpxXml = `<?xml version="1.0"?>
        <gpx>
          <trk>
            <trkseg>
              <trkpt lat="50.0" lon="14.0"></trkpt>
            </trkseg>
            <trkseg>
              <trkpt lat="51.0" lon="15.0"></trkpt>
            </trkseg>
          </trk>
        </gpx>`;

      const result = parseGPX(gpxXml, "multi.gpx");
      expect(result.tracks).toHaveLength(2);
    });
  });

  describe("mergeGPXData", () => {
    const gpx1: GPXData = {
      name: "Route 1",
      tracks: [[{ lat: 50.0, lon: 14.0, ele: 200 }]],
      waypoints: [{ lat: 50.0, lon: 14.0, name: "Start" }],
    };

    const gpx2: GPXData = {
      name: "Route 2",
      tracks: [[{ lat: 51.0, lon: 15.0, ele: 300 }]],
      waypoints: [{ lat: 51.0, lon: 15.0, name: "End" }],
    };

    it("should return empty GPXData for empty array", () => {
      const result = mergeGPXData([]);
      expect(result.name).toBe("empty");
      expect(result.tracks).toHaveLength(0);
      expect(result.waypoints).toHaveLength(0);
    });

    it("should return the same GPXData for single file", () => {
      const result = mergeGPXData([gpx1]);
      expect(result).toBe(gpx1);
    });

    it("should merge multiple GPX files", () => {
      const result = mergeGPXData([gpx1, gpx2]);

      expect(result.name).toBe("merged_2_files");
      expect(result.tracks).toHaveLength(2);
      expect(result.waypoints).toHaveLength(2);
      expect(result.metadata?.name).toBe("Merged: Route 1 + Route 2");
      expect(result.metadata?.desc).toBe("Merged GPX file from 2 files");
    });
  });

  describe("gpxDataToXML", () => {
    it("should generate valid GPX XML", () => {
      const gpxData: GPXData = {
        name: "Test",
        tracks: [[{ lat: 50.0, lon: 14.0, ele: 200, time: "2024-01-01T10:00:00Z" }]],
        waypoints: [{ lat: 50.5, lon: 14.5, ele: 250 }],
        metadata: {
          name: "Test Route",
          desc: "A test route",
        },
      };

      const xml = gpxDataToXML(gpxData);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<gpx version="1.1"');
      expect(xml).toContain("<name>Test Route</name>");
      expect(xml).toContain("<desc>A test route</desc>");
      expect(xml).toContain('<wpt lat="50.5" lon="14.5">');
      expect(xml).toContain("<ele>250</ele>");
      expect(xml).toContain('<trkpt lat="50" lon="14">');
      expect(xml).toContain("<time>2024-01-01T10:00:00Z</time>");
    });

    it("should handle missing optional fields", () => {
      const gpxData: GPXData = {
        name: "Minimal",
        tracks: [[{ lat: 50.0, lon: 14.0 }]],
        waypoints: [],
      };

      const xml = gpxDataToXML(gpxData);
      
      expect(xml).toContain("<name>Minimal</name>");
      expect(xml).not.toContain("<wpt");
    });
  });

  describe("calculateDistance", () => {
    it("should return 0 for empty array", () => {
      expect(calculateDistance([])).toBe(0);
    });

    it("should return 0 for single point", () => {
      const points: TrackPoint[] = [{ lat: 50.0, lon: 14.0 }];
      expect(calculateDistance(points)).toBe(0);
    });

    it("should calculate distance between two points", () => {
      const points: TrackPoint[] = [
        { lat: 50.0, lon: 14.0 },
        { lat: 50.1, lon: 14.0 },
      ];
      const distance = calculateDistance(points);
      // ~11.1 km for 0.1 degree latitude difference
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(12);
    });

    it("should sum distances for multiple points", () => {
      const points: TrackPoint[] = [
        { lat: 50.0, lon: 14.0 },
        { lat: 50.1, lon: 14.0 },
        { lat: 50.2, lon: 14.0 },
      ];
      const distance = calculateDistance(points);
      // Should be approximately double the single segment
      expect(distance).toBeGreaterThan(20);
      expect(distance).toBeLessThan(24);
    });
  });

  describe("getTotalPoints", () => {
    it("should return 0 for empty tracks", () => {
      const gpxData: GPXData = { name: "test", tracks: [], waypoints: [] };
      expect(getTotalPoints(gpxData)).toBe(0);
    });

    it("should count all points across tracks", () => {
      const gpxData: GPXData = {
        name: "test",
        tracks: [
          [{ lat: 50.0, lon: 14.0 }, { lat: 50.1, lon: 14.1 }],
          [{ lat: 51.0, lon: 15.0 }],
        ],
        waypoints: [],
      };
      expect(getTotalPoints(gpxData)).toBe(3);
    });
  });

  describe("getTotalDistance", () => {
    it("should return 0 for empty tracks", () => {
      const gpxData: GPXData = { name: "test", tracks: [], waypoints: [] };
      expect(getTotalDistance(gpxData)).toBe(0);
    });

    it("should sum distances from all tracks", () => {
      const gpxData: GPXData = {
        name: "test",
        tracks: [
          [{ lat: 50.0, lon: 14.0 }, { lat: 50.1, lon: 14.0 }],
          [{ lat: 51.0, lon: 15.0 }, { lat: 51.1, lon: 15.0 }],
        ],
        waypoints: [],
      };
      const distance = getTotalDistance(gpxData);
      expect(distance).toBeGreaterThan(20);
    });
  });
});
