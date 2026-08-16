// The liaison types live with the service that owns them — the API, the
// allocator and the UI all speak the same shapes. Re-exported here so the
// client components keep their local import path.
export type {
  Config,
  Gender,
  House,
  LiaisonState,
  LogEntry,
  OG,
  Student,
} from "@/services/liaison/types";
