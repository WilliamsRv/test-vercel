import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDepreciationHistoryByAsset } from "../../services/depreciationService.js";


export default function DepreciationHistoryPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadData = async () => {
      try {
        let info = await getDepreciationHistoryByAsset(assetId);


        // 🔹 Ordenamos por año fiscal y mes
        info.sort((a, b) => {
          if (a.fiscalYear !== b.fiscalYear) {
            return a.fiscalYear - b.fiscalYear;
          }
          return a.calculationMonth - b.calculationMonth;
        });


        setData(info);
      } catch (error) {
        console.error("Error al obtener historial:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [assetId]);


  const formatNumber = (num) =>
    num ? num.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "0.00";


  const monthNames = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"
  ];


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded shadow-sm transition-colors"
      >
        ← Volver
      </button>


      <h1 className="text-3xl font-semibold text-gray-800 mb-6">
        Historial completo de depreciación
      </h1>


      {loading ? (
        <p className="text-gray-500">Cargando datos...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-500">
          No existen registros de depreciación para este bien.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-indigo-600 text-white uppercase text-left">
              <tr>
                <th className="p-3">Año Fiscal</th>
                <th className="p-3">Mes</th>
                <th className="p-3">Dep. Mensual (S/)</th>
                <th className="p-3">Dep. Acumulada (S/)</th>
                <th className="p-3">Valor Neto (S/)</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((dep, i) => {
                const valorResidual = dep.residualValue ?? 1.0;
                const valorNeto = Math.max(dep.currentBookValue, valorResidual);
                const depAcumulada = Math.min(
                  dep.currentAccumulatedDepreciation,
                  (dep.initialValue || 0) - valorResidual
                );


                return (
                  <tr
                    key={dep.id || i}
                    className={`border-b transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-indigo-50`}
                  >
                    <td className="p-3 font-medium">{dep.fiscalYear}</td>
                    <td className="p-3">{monthNames[dep.calculationMonth - 1]}</td>
                    <td className="p-3 text-right">{formatNumber(dep.monthlyDepreciation)}</td>
                    <td className="p-3 text-right">{formatNumber(depAcumulada)}</td>
                    <td className="p-3 text-right">{formatNumber(valorNeto)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          dep.calculationStatus === "CALCULATED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {dep.calculationStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
