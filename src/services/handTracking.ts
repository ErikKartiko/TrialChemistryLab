// ------------------------------------------------------------------
// Hand tracking service — MediaPipe HandLandmarker (lazy-loaded).
// Runtime WASM + model stream from CDN; if unavailable the caller
// falls back to touch controls. Never hard-fails the app.
// ------------------------------------------------------------------

export interface HandPoint { x: number; y: number; z: number }

export interface TrackedHand {
  label: string;                                // "Left" | "Right"
  points: HandPoint[];                          // 21 landmarks, normalized [0..1]
  pinchPoint: { x: number; y: number };         // mid of thumb-tip ↔ index-tip
  pinchRatio: number;                           // thumb-index dist / hand size
  grabbing: boolean;                            // hysteresis-filtered pinch
  palm: { x: number; y: number };               // palm center
}

export interface HandFrame { hands: TrackedHand[] }

/** standard 21-landmark skeleton connections */
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const PINCH_ENGAGE = 0.32;   // start grab below this ratio
const PINCH_RELEASE = 0.48;  // release above this ratio

export class HandTracker {
  private landmarker: any = null;
  private lastVideoTime = -1;
  private grabFlags = new Map<string, boolean>();

  /** returns true when the tracker is ready; false → caller falls back */
  async init(onStatus?: (s: string) => void): Promise<boolean> {
    try {
      onStatus?.("Loading tracking runtime…");
      const mp: any = await import("@mediapipe/tasks-vision");
      const vision = await mp.FilesetResolver.forVisionTasks(WASM_URL);
      onStatus?.("Loading hand model…");
      const opts = (delegate: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      try {
        this.landmarker = await mp.HandLandmarker.createFromOptions(vision, opts("GPU"));
      } catch {
        onStatus?.("GPU delegate failed — using CPU…");
        this.landmarker = await mp.HandLandmarker.createFromOptions(vision, opts("CPU"));
      }
      return true;
    } catch (err) {
      console.warn("[arcl] hand tracking unavailable:", err);
      this.landmarker = null;
      return false;
    }
  }

  detect(video: HTMLVideoElement): HandFrame | null {
    if (!this.landmarker || video.readyState < 2) return null;
    if (video.currentTime === this.lastVideoTime) return null; // same video frame → skip
    this.lastVideoTime = video.currentTime;

    let res: any;
    try {
      res = this.landmarker.detectForVideo(video, performance.now());
    } catch {
      return null;
    }
    if (!res?.landmarks?.length) return { hands: [] };

    const hands: TrackedHand[] = res.landmarks.map((lm: any[], i: number) => {
      const points: HandPoint[] = lm.map((p: any) => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
      const label: string = res.handedness?.[i]?.[0]?.categoryName ?? `Hand${i}`;

      const dist = (a: HandPoint, b: HandPoint) => Math.hypot(a.x - b.x, a.y - b.y);
      const handSize = Math.max(0.0001, dist(points[0], points[9])); // wrist → middle MCP
      const pinchRatio = dist(points[4], points[8]) / handSize;

      const key = `${label}-${i}`;
      const was = this.grabFlags.get(key) ?? false;
      const grabbing = was ? pinchRatio < PINCH_RELEASE : pinchRatio < PINCH_ENGAGE;
      this.grabFlags.set(key, grabbing);

      const palmIdx = [0, 5, 9, 13, 17];
      const palm = {
        x: palmIdx.reduce((s, j) => s + points[j].x, 0) / palmIdx.length,
        y: palmIdx.reduce((s, j) => s + points[j].y, 0) / palmIdx.length,
      };

      return {
        label,
        points,
        pinchPoint: { x: (points[4].x + points[8].x) / 2, y: (points[4].y + points[8].y) / 2 },
        pinchRatio,
        grabbing,
        palm,
      };
    });

    return { hands };
  }

  dispose() {
    try { this.landmarker?.close?.(); } catch { /* noop */ }
    this.landmarker = null;
  }
}
