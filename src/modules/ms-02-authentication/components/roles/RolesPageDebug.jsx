import { useEffect, useState } from "react";
import roleService from "../../services/roleService";

export default function RolesPageDebug({ onBack }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadRoles();
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const userInfo = await roleService.getCurrentUser();
      setDebugInfo(userInfo);
    } catch (err) {
      console.error("Error al cargar debug info:", err);
    }
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Iniciando carga de roles...");
      console.log("🌐 URL del API:", "http://localhost:5002/api/v1/roles");

      // Verificar token
      const token = localStorage.getItem("accessToken");
      console.log("🔑 Token presente:", !!token);
      if (token) {
        console.log(
          "🔑 Token (primeros 50 chars):",
          token.substring(0, 50) + "..."
        );
      }

      const data = await roleService.getAllRoles();
      console.log("✅ Respuesta del servidor:", data);
      console.log("📊 Tipo de datos:", typeof data);
      console.log("📊 Es array:", Array.isArray(data));

      if (Array.isArray(data)) {
        console.log("📊 Cantidad de roles:", data.length);
        data.forEach((role, index) => {
          console.log(`Rol ${index + 1}:`, role);
        });
      }

      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error completo:", err);
      console.error("❌ Mensaje del error:", err.message);
      console.error("❌ Stack del error:", err.stack);
      setError(`Error al cargar los roles: ${err.message}`);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log("🧪 Probando conexión directa...");
      const response = await fetch("http://localhost:5002/api/v1/roles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      console.log("🧪 Status de respuesta:", response.status);
      console.log("🧪 Headers de respuesta:", [...response.headers.entries()]);

      if (response.ok) {
        const data = await response.json();
        console.log("🧪 Datos recibidos:", data);
      } else {
        const errorText = await response.text();
        console.log("🧪 Error del servidor:", errorText);
      }
    } catch (err) {
      console.error("🧪 Error de conexión:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              🔍 Debug - Gestión de Roles
            </h1>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                ← Volver
              </button>
            )}
          </div>

          {/* Información de Debug */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-800 mb-2">
              🔍 Información de Debug
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">🌐 URL del API:</span>
                <span className="ml-2 font-mono">
                  http://localhost:5002/api/v1/roles
                </span>
              </div>
              <div>
                <span className="font-medium">🔑 Token presente:</span>
                <span className="ml-2">
                  {localStorage.getItem("accessToken") ? "✅ Sí" : "❌ No"}
                </span>
              </div>
              <div>
                <span className="font-medium">👤 Usuario actual:</span>
                <span className="ml-2">
                  {debugInfo?.sub || debugInfo?.userId || "No identificado"}
                </span>
              </div>
              <div>
                <span className="font-medium">🎭 Roles:</span>
                <span className="ml-2">
                  {JSON.stringify(
                    debugInfo?.roles || debugInfo?.authorities || []
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={testConnection}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              🧪 Probar Conexión
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <h3 className="font-bold mb-2">❌ Error</h3>
              <p>{error}</p>
            </div>
          )}

          {/* Resultados */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-2">📊 Resultados</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">📊 Cantidad de roles:</span>
                <span className="ml-2">{roles.length}</span>
              </div>
              <div>
                <span className="font-medium">📊 Estado de carga:</span>
                <span className="ml-2">
                  {loading ? "Cargando..." : "Completado"}
                </span>
              </div>
            </div>

            {roles.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Roles encontrados:
                </h4>
                <div className="space-y-2">
                  {roles.map((role, index) => (
                    <div
                      key={role.id || index}
                      className="bg-white p-3 rounded border"
                    >
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-600">
                        {role.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {role.id} | Activo: {role.active ? "Sí" : "No"} |
                        Sistema: {role.isSystem ? "Sí" : "No"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={loadRoles}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              🔄 Recargar Roles
            </button>
            <button
              onClick={loadDebugInfo}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              🔄 Recargar Debug Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
