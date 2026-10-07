import React from 'react';
import { FileSpreadsheet, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  onExportExcel: () => void;
  onExportImage: () => void;
  onOpenNewClassDialog: () => void;
  isExportingImage: boolean;
  disabled: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportExcel,
  onExportImage,
  onOpenNewClassDialog,
  isExportingImage,
  disabled,
}) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2" data-export-ignore="true">
      <button
        type="button"
        onClick={onOpenNewClassDialog}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Roster</span>
      </button>

      {/* Export Options */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportExcel}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Download Excel</span>
        </button>

        <button
          type="button"
          onClick={onExportImage}
          disabled={disabled || isExportingImage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          {isExportingImage ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span>{isExportingImage ? 'Generating...' : 'Download Image'}</span>
        </button>
      </div>
    </div>
  );
};
