import { HardDrive, Trash2 } from "lucide-react";

interface StorageBarProps {
  usedGb: number;
  totalGb: number;
  modelCount?: number;
}

/**
 * StorageBar — Visual indicator of local disk space consumed by downloaded models.
 */
export function StorageBar({ usedGb, totalGb, modelCount = 2 }: StorageBarProps) {
  const percentage = Math.min((usedGb / totalGb) * 100, 100);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3.5 bg-[#121215] border border-[#27272a] rounded-xl">
      <div className="flex items-center gap-3.5 flex-1">
        <div className="w-9 h-9 rounded-xl bg-[#18181c] border border-[#27272a] flex items-center justify-center text-[#f4f4f5] shrink-0">
          <HardDrive className="w-4 h-4" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[#f4f4f5] font-bold tracking-tight">Local Model Directory (~/.m0x-flow/models)</span>
            <span className="font-mono text-[#f4f4f5] font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
              {usedGb.toFixed(1)} GB / {totalGb} GB ({percentage.toFixed(1)}%)
            </span>
          </div>

          <div className="h-2 bg-[#18181c] rounded-full overflow-hidden border border-[#27272a] p-0.5">
            <div
              className="h-full bg-[#f4f4f5] rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-[#27272a] pt-2.5 sm:pt-0 sm:pl-4">
        <span className="text-xs font-mono font-semibold text-[#f4f4f5] bg-[#18181c] px-3 py-1.5 rounded-xl border border-[#27272a]">
          {modelCount} Models Installed
        </span>
        <button
          type="button"
          className="p-2 rounded-xl bg-[#18181c] hover:bg-[#222226] text-[#a1a1aa] hover:text-white border border-[#27272a] transition-all cursor-pointer"
          title="Clean cache / delete unlinked models"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}


