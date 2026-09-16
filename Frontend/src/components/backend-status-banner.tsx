import { AlertTriangle, RefreshCw, WifiOff, CloudUpload, Download } from "lucide-react";
import { useConnectionStatus } from "../hooks/use-connection-status";
import { useOfflineSync } from "../hooks/use-offline-sync";
import { usePWA } from "../hooks/use-pwa";

export function BackendStatusBanner() {
  const { deviceOnline, backendReachable, isChecking, checkNow } = useConnectionStatus();
  const { isSyncing, pendingCount, syncNow } = useOfflineSync();
  const { isInstallable, promptInstall } = usePWA();

  // State 1: Device is genuinely offline (no internet / WiFi / Cellular)
  if (!deviceOnline) {
    return (
      <aside
        aria-label="Offline status"
        className="w-full bg-amber-950/80 border-b border-amber-600/50 text-cream px-4 py-2 text-xs sm:text-sm font-medium transition-all shadow-sm backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> All games, tasks, and memories are safely cached
              locally.
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {pendingCount} item{pendingCount > 1 ? "s" : ""} queued for sync
              </span>
            )}
          </div>
          {isInstallable && (
            <button
              type="button"
              onClick={promptInstall}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sun/20 border border-sun/50 text-sun hover:bg-sun/30 text-xs font-bold transition"
            >
              <Download size={13} />
              Install SmritiSetu App
            </button>
          )}
        </div>
      </aside>
    );
  }

  // State 2: Device has internet, but backend API is unreachable
  if (!backendReachable) {
    return (
      <aside
        aria-label="Backend status"
        className="w-full bg-orange-950/80 border-b border-orange-600/50 text-cream px-4 py-2.5 text-xs sm:text-sm font-medium transition-all shadow-sm backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400 shrink-0" />
            <span>
              <strong>Having trouble reaching the server:</strong> Your changes are saved and will
              sync automatically.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkNow}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-clay text-cream hover:bg-clay text-xs font-bold transition disabled:opacity-50"
            >
              <RefreshCw size={12} className={isChecking ? "animate-spin text-sun" : "text-sun"} />
              {isChecking ? "Checking…" : "Retry"}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // State 3: Device is online, server is reachable, and we have offline changes queued
  if (pendingCount > 0) {
    return (
      <aside
        aria-label="Pending sync status"
        className="w-full bg-sky-950/80 border-b border-sky-600/50 text-cream px-4 py-2 text-xs sm:text-sm font-medium transition-all shadow-sm backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CloudUpload size={16} className="text-sky-400 shrink-0" />
            <span>
              <strong>Internet Restored:</strong> You have {pendingCount} offline update
              {pendingCount > 1 ? "s" : ""} ready to synchronize.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500 text-ink hover:bg-sky-400 text-xs font-bold transition disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing…" : "Sync to Server Now"}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // State 4: Optional install banner if app is installable PWA
  if (isInstallable) {
    return (
      <aside
        aria-label="Install App banner"
        className="w-full bg-surface/90 border-b border-clay/60 text-cream px-4 py-1.5 text-xs font-medium transition-all"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <span className="text-cream/90 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Install SmritiSetu on your device for one-tap home screen access and faster offline
            play.
          </span>
          <button
            type="button"
            onClick={promptInstall}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sun text-ink hover:bg-sun/90 text-xs font-bold transition"
          >
            <Download size={12} />
            Install App
          </button>
        </div>
      </aside>
    );
  }

  // State 5: Everything is healthy and connected -> No banner
  return null;
}
