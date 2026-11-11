export type ZoneState = 'owned' | 'fragile' | 'fading' | 'dark' | 'unknown';
export type Flag = 'hard-to-verify' | 'unreviewed-agent-code';
export interface Config {
  mode: 'solo' | 'team'; zones: Record<string, string[]>; critical: string[]; exclude: string[];
  threshold: number; fadingFloor: number; activeDays: number; halfLifeDays: number; historyDays: number;
  handoff: { enabled: boolean; minLines: number }; handles: Record<string, string>;
}
export interface FileEntry { path: string; loc: number; hash: string }
export interface Zone { id: string; files: string[]; loc: number; fingerprint: Record<string, string> }
export interface FileChange { path: string; added: number; deleted: number }
export interface Commit { sha: string; email: string; date: Date; message: string; agentTrailer: boolean; files: FileChange[] }
export interface EditLogEntry { file: string; ranges: Array<[number, number]>; lines: number; session: string; ts: string }
export interface PassEvent { zone: string; level: number; fingerprint: Record<string, string>; date: string; kind: 'session' | 'handoff' }
export interface AgentShareEntry { zone: string; agentLines: number; week: string }
export interface Evidence { kind: 'human-commits' | 'agent-share' | 'pass' | 'partial' | 'review' | 'decay-change' | 'decay-time' | 'inactive' | 'flag'; text: string }
export interface PersonLevel { handle: string; level: number; active: boolean; evidence: Evidence[] }
export interface Criticality { score: number; fanIn: number; churn90: number; loc: number; fixes90: number; tagged: boolean }
export interface ZoneResult { zone: Zone; state: ZoneState; people: PersonLevel[]; agentShare: number; criticality: Criticality; darkness: number; danger: number; reason: string; flags: Flag[] }
export interface MapResult { mode: Config['mode']; generatedAt: string; me: string; zones: ZoneResult[]; top: ZoneResult[]; unclearCritical: ZoneResult[]; counts: Record<ZoneState, number> }
