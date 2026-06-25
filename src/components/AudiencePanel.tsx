import { Building2, Users } from 'lucide-react';

type Props = {
  selectedBuildings: string[];
  toggleBuilding: (building: string) => void;
  recipientCount: number;
  buildingCounts: Record<string, number>;
};

const BUILDINGS = [
  '10 Regent',
  'Brownstone Condominiums',
  '123 River St',
  '30 regent',
  '333 Grand St',
  '50 Regent',
  '88 Regent',
  '9 Regent',
  'TEST',
];

export function AudiencePanel({
  selectedBuildings,
  toggleBuilding,
  recipientCount,
  buildingCounts,
}: Props) {
  const allSelected = BUILDINGS.every((b) => selectedBuildings.includes(b));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-50 rounded-lg">
            <Building2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Audience</h2>
            <p className="text-xs text-slate-500">Select buildings to notify</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
          <Users className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-xs font-semibold text-emerald-700">{recipientCount}</span>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        <button
          onClick={() => {
            if (allSelected) {
              BUILDINGS.forEach((b) => selectedBuildings.includes(b) && toggleBuilding(b));
            } else {
              BUILDINGS.forEach((b) => !selectedBuildings.includes(b) && toggleBuilding(b));
            }
          }}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
            allSelected
              ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-100'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                allSelected ? 'bg-brand-400 border-brand-400' : 'border-slate-300'
              }`}
            >
              {allSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm font-semibold text-slate-900">All Buildings</span>
          </div>
          <span className="text-xs text-slate-500">
            {Object.values(buildingCounts).reduce((a, b) => a + b, 0)} residents
          </span>
        </button>

        {BUILDINGS.map((building) => {
          const isSelected = selectedBuildings.includes(building);
          return (
            <button
              key={building}
              onClick={() => toggleBuilding(building)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-white border-brand-300 ring-1 ring-brand-100'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-brand-400 border-brand-400' : 'border-slate-300'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900">{building}</div>
                  <div className="text-xs text-slate-500">
                    Yardi-synced
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-slate-600">
                {buildingCounts[building] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
