import React from 'react'
import DashboardWidgets from '../components/DashboardWidgets'
import LastMovements from '../components/LastMovements'
import '../components/dashboard.css'

export default function DashboardModule(){
   console.log("id de municipalidad", localStorage.getItem('municipalityId'));
   console.log("id de usuario", localStorage.getItem('userId'));
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl shadow-xl p-6 -mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Panel de Control</h2>
            <p className="text-sm text-slate-500">Resumen general del sistema</p>

          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border rounded-md text-sm text-slate-700 hover:shadow">Exportar</button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm shadow">Generar Reporte</button>
          </div>
        </div>

        <DashboardWidgets />

        <div className="mt-6">
          <LastMovements />
        </div>
      </div>
    </div>
  )
}

