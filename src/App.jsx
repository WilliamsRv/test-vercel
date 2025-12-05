import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SidebarLayout from "./layouts/SidebarLayout";
import Dashboard from "./modules/ms-01-dashboard/pages";
import TenantManagement from "./modules/ms-01-tenant-management/pages";
import { AuthProvider } from "./modules/ms-02-authentication/components/AuthProvider.jsx";
import {
  withAuth,
  withPublicAuth,
} from "./modules/ms-02-authentication/hooks/useProtectedRoute.jsx";
import { LoginPage } from "./modules/ms-02-authentication/pages";
import Categoria from "./modules/ms-03-configuration/components/categoria/category.jsx";
import sistema from "./modules/ms-03-configuration/components/sistema/SystemConfiguration.jsx";
import Bienes from "./modules/ms-04-patrimonio/pages/assets/AssetListPage";
import DepreciationHistoryPage from "./modules/ms-04-patrimonio/pages/depreciation/DepreciationHistoryPage";
import DisposalManagement from "./modules/ms-04-patrimonio/pages/disposals/DisposalManagementPage";

import Personas from "./modules/ms-02-authentication/components/personas/PersonasPage";
import Usuarios from "./modules/ms-02-authentication/components/usuarios/UsuariosPage";
import Roles from "./modules/ms-02-authentication/components/roles/RolesPage";
import Permisos from "./modules/ms-02-authentication/components/permissions/PermissionsPage";
import Areas from "./modules/ms-03-configuration/components/areas/AreasPage";
import Cargos from "./modules/ms-03-configuration/components/cargos/PositionList";
import Suppliers from "./modules/ms-03-configuration/components/suppliers";
import Movimientos from "./modules/ms-05-movements/pages";
import Actas from "./modules/ms-05-movements/pages/ActasPage";
import Inventarios from "./modules/ms-06-inventario/pages";
import InventoryDetailsPage from "./modules/ms-06-inventario/pages/InventoryDetailsPage";
import Mantenimientos from "./modules/ms-07-mantenimiento/pages";
import Reportes from "./modules/ms-08-reportes/pages";
import PhysicalLocationPage from "./modules/ms-03-configuration/components/physical-location/PhysicalLocationPage.jsx";

// Componentes protegidos
const ProtectedDashboard = withAuth(Dashboard);
const ProtectedTenantManagement = withAuth(TenantManagement);
const ProtectedBienes = withAuth(Bienes);
const ProtectedMovimientos = withAuth(Movimientos);
const ProtectedActas = withAuth(Actas);
const ProtectedInventarios = withAuth(Inventarios);
const ProtectedInventoryDetails = withAuth(InventoryDetailsPage);
const ProtectedMantenimientos = withAuth(Mantenimientos);
const ProtectedAreas = withAuth(Areas);
const ProtectedSuppliers = withAuth(Suppliers);
const ProtectedPersonas = withAuth(Personas);
const ProtectedUsuarios = withAuth(Usuarios);
const ProtectedRoles = withAuth(Roles);
const ProtectedPermisos = withAuth(Permisos);
const ProtectedCargos = withAuth(Cargos);
const ProtectedReportes = withAuth(Reportes);
const ProtectedCategoria = withAuth(Categoria);
const Protectedsistema = withAuth(sistema);

const ProtectedPhysicalLocation = withAuth(PhysicalLocationPage);

const ProtectedDisposalManagement = withAuth(DisposalManagement);


// Componentes públicos
const PublicLogin = withPublicAuth(LoginPage);

function App() {
  // Ocultar pantalla de carga cuando la app esté lista
  useEffect(() => {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {

     
      setTimeout(() => {
        loadingScreen.style.opacity = "0";
        loadingScreen.style.transition = "opacity 0.5s ease-out";
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }, 1000); // Mostrar por 1 segundo
    }
  }, []);

  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<PublicLogin />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <SidebarLayout>
              <ProtectedDashboard />
            </SidebarLayout>
          }
        />
        <Route
          path="/admin/municipalidades"
          element={
            <SidebarLayout>
              <ProtectedTenantManagement />
            </SidebarLayout>
          }
        />
        <Route
          path="/admin/suscripciones"
          element={
            <SidebarLayout>
              <ProtectedTenantManagement />
            </SidebarLayout>
          }
        />
        <Route
          path="/admin/facturacion"
          element={
            <SidebarLayout>
              <ProtectedTenantManagement />
            </SidebarLayout>
          }
        />
        <Route
          path="/admin/onboarding"
          element={
            <SidebarLayout>
              <ProtectedTenantManagement />
            </SidebarLayout>
          }
        />
        <Route
          path="/bienes"
          element={
            <SidebarLayout>
              <ProtectedBienes />
            </SidebarLayout>
          }
        />
        <Route
  path="/historial/:assetId"
  element={
    <SidebarLayout>
      <DepreciationHistoryPage />
    </SidebarLayout>
  }
/>
        
        <Route
          path="/bajas"
          element={
            <SidebarLayout>
              <ProtectedDisposalManagement />
            </SidebarLayout>
          }
        />

        <Route
          path="/movimientos"
          element={
            <SidebarLayout>
              <ProtectedMovimientos />
            </SidebarLayout>
          }
        />
        <Route
          path="/actas"
          element={
            <SidebarLayout>
              <ProtectedActas />
            </SidebarLayout>
          }
        />
        <Route
          path="/inventarios"
          element={
            <SidebarLayout>
              <ProtectedInventarios />
            </SidebarLayout>
          }
        />
        <Route
          path="/inventarios/:inventoryId/detalles"
          element={
            <SidebarLayout>
              <ProtectedInventoryDetails />
            </SidebarLayout>
          }
        />
        <Route
          path="/mantenimientos"
          element={
            <SidebarLayout>
              <ProtectedMantenimientos />
            </SidebarLayout>
          }
        />
        <Route
          path="/areas"
          element={
            <SidebarLayout>
              <ProtectedAreas />
            </SidebarLayout>
          }
        />
        <Route
          path="/ubicaciones"
          element={
            <SidebarLayout>
              <ProtectedPhysicalLocation />
            </SidebarLayout>
          }
        />
        <Route
          path="/proveedores"
          element={
            <SidebarLayout>
              <ProtectedSuppliers />
            </SidebarLayout>
          }
        />
        <Route
          path="/personas"
          element={
            <SidebarLayout>
              <ProtectedPersonas />
            </SidebarLayout>
          }
        />
        <Route
          path="/usuarios"
          element={
            <SidebarLayout>
              <ProtectedUsuarios />
            </SidebarLayout>
          }
        />
        <Route
          path="/roles"
          element={
            <SidebarLayout>
              <ProtectedRoles />
            </SidebarLayout>
          }
        />
        <Route
          path="/permisos"
          element={
            <SidebarLayout>
              <ProtectedPermisos />
            </SidebarLayout>
          }
        />
        <Route
          path="/cargos"
          element={
            <SidebarLayout>
              <ProtectedCargos />
            </SidebarLayout>
          }
        />
        <Route
          path="/reportes"
          element={
            <SidebarLayout>
              <ProtectedReportes />
            </SidebarLayout>
          }
        />
        <Route
          path="/categorias"
          element={
            <SidebarLayout>
              <ProtectedCategoria />
            </SidebarLayout>
          }
        />
        <Route
          path="/sistema"
          element={
            <SidebarLayout>
              <Protectedsistema />
            </SidebarLayout>
          }
        />
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
