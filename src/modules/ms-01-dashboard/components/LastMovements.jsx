import React from 'react'

export default function LastMovements(){
  return (
    <div className="bg-white rounded-xl p-5 shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Últimos movimientos</h3>
        <div className="text-sm text-slate-500">Hoy</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-md border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">Código</div>
              <div className="font-bold text-slate-900">B001</div>
              <div className="text-xs text-slate-400 mt-1">Laptop Lenovo — Activo</div>
            </div>
            <div className="text-sm px-2 py-1 rounded-full bg-green-50 text-green-700">Activo</div>
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">Código</div>
              <div className="font-bold text-slate-900">B002</div>
              <div className="text-xs text-slate-400 mt-1">Escritorio — Mantenimiento</div>
            </div>
            <div className="text-sm px-2 py-1 rounded-full bg-amber-100 text-amber-700">Mantenimiento</div>
          </div>
        </div>

        <div className="p-4 rounded-md border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">Código</div>
              <div className="font-bold text-slate-900">B003</div>
              <div className="text-xs text-slate-400 mt-1">Proyector — En uso</div>
            </div>
            <div className="text-sm px-2 py-1 rounded-full bg-sky-50 text-sky-700">En uso</div>
          </div>
        </div>
      </div>
    </div>
  )
}
