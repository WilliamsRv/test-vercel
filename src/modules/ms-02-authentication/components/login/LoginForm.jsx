import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../hooks/useAuth.jsx";

export default function LoginForm() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función para parsear errores específicos del servidor
  const parseLoginError = (error) => {
    // Soporte para error.details (userService) o error.errorData (legacy)
    const errorData = error.errorData || error.details || {};
    const message = (error.message || "").trim();

    // Detectar usuario bloqueado (por intentos fallidos)
    if (errorData.blockedUntil || message.toLowerCase().includes("bloqueado")) {
      const blockedUntil = errorData.blockedUntil ? new Date(errorData.blockedUntil) : null;

      let timeDetails = "";
      if (blockedUntil) {
        const now = new Date();
        const diffMs = blockedUntil - now;
        if (diffMs > 0) {
          let diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          let diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          timeDetails = `Intenta nuevamente en ${diffHours}h ${diffMinutes}m`;
        }
      }

      return {
        type: "blocked",
        title: "Cuenta Bloqueada",
        // ✅ USAR MENSAJE DEL BACKEND SI EXISTE (Requisito UX)
        message: message || `La cuenta de <strong>${formData.username}</strong> ha sido bloqueada por seguridad.`,
        details: timeDetails,
        blockedUntil: blockedUntil ? blockedUntil.toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }) : null,
        blockReason: errorData.blockReason || "Cuenta bloqueada por intentos fallidos",
        icon: "🔒"
      };
    }

    // Detectar usuario suspendido (por estado o por campo suspendedUntil)
    if (errorData.status === "SUSPENDED" || errorData.suspendedUntil || message.toLowerCase().includes("suspendido")) {
      const suspensionEnd = errorData.suspendedUntil ? new Date(errorData.suspendedUntil) : null;

      return {
        type: "suspended",
        title: "Cuenta Suspendida",
        // ✅ USAR MENSAJE DEL BACKEND SI EXISTE (Requisito UX)
        message: message || `La cuenta de <strong>${formData.username}</strong> ha sido suspendida.`,
        details: errorData.suspensionReason || "Contacta al administrador para más información",
        suspensionEnd: suspensionEnd ? suspensionEnd.toLocaleString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }) : null,
        icon: "⏸️"
      };
    }

    // Detectar usuario inactivo (por estado o por mensaje)
    if (errorData.status === "INACTIVE" || message.toLowerCase().includes("inactivo")) {
      return {
        type: "inactive",
        title: "Cuenta Inactiva",
        message: `La cuenta de <strong>${formData.username}</strong> está inactiva.`,
        details: "Contacta al administrador para reactivarla",
        icon: "⚠️"
      };
    }

    // Detectar intentos fallidos restantes
    if (errorData.remainingAttempts !== undefined) {
      return {
        type: "invalid_attempts",
        title: "Credenciales Incorrectas",
        message: `Usuario o contraseña incorrectos.`,
        details: `Te ${errorData.remainingAttempts === 1 ? 'queda' : 'quedan'} ${errorData.remainingAttempts} ${errorData.remainingAttempts === 1 ? 'intento' : 'intentos'} antes de que tu cuenta sea bloqueada.`,
        remainingAttempts: errorData.remainingAttempts,
        icon: "❌"
      };
    }

    // Credenciales inválidas (por defecto)
    return {
      type: "invalid",
      title: "Error de Autenticación",
      message: message || "Usuario o contraseña incorrectos",
      icon: "❌"
    };
  };

  // Función para mostrar alertas estilo iOS
  const showIOSAlert = (config) => {
    const { type, title, message, details, blockedUntil, suspensionEnd, remainingAttempts, blockReason, icon } = config;

    let iconBg = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";

    if (type === "blocked") {
      iconBg = "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)";
    } else if (type === "suspended") {
      iconBg = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    } else if (type === "inactive") {
      iconBg = "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";
    } else if (type === "invalid_attempts") {
      iconBg = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    }

    let detailsHTML = "";
    if (type === "blocked" && blockedUntil) {
      detailsHTML = `
        <div style="margin-top: 16px; padding: 14px; background: #fee2e2; border-radius: 10px; border-left: 4px solid #dc2626;">
          <p style="font-size: 12px; color: #7f1d1d; margin: 0 0 8px 0; font-weight: 600;">
            ⏰ Desbloqueado: <br/><strong>${blockedUntil}</strong>
          </p>
          ${blockReason ? `<p style="font-size: 11px; color: #991b1b; margin: 0; font-weight: 500;">📝 ${blockReason}</p>` : ''}
        </div>
      `;
    } else if (type === "suspended") {
      detailsHTML = `
        <div style="margin-top: 16px; padding: 14px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
          ${suspensionEnd ? `<p style="font-size: 12px; color: #92400e; margin: 0 0 8px 0; font-weight: 600;">
            📅 Suspensión hasta: <br/><strong>${suspensionEnd}</strong>
          </p>` : ''}
          <p style="font-size: 11px; color: #78350f; margin: 0; font-weight: 500;">📝 ${details}</p>
        </div>
      `;
    } else if (type === "invalid_attempts" && remainingAttempts !== undefined) {
      const bgColor = remainingAttempts === 1 ? "#fee2e2" : "#fef3c7";
      const borderColor = remainingAttempts === 1 ? "#ef4444" : "#f59e0b";
      const textColor = remainingAttempts === 1 ? "#7f1d1d" : "#92400e";
      detailsHTML = `
        <div style="margin-top: 16px; padding: 14px; background: ${bgColor}; border-radius: 10px; border-left: 4px solid ${borderColor};">
          <p style="font-size: 12px; color: ${textColor}; margin: 0; font-weight: 600;">
            ⚠️ Intentos restantes: <strong>${remainingAttempts}</strong>
          </p>
        </div>
      `;
    }

    Swal.fire({
      html: `
        <div style="padding: 32px 24px;">
          <div style="display: flex; justify-content: center; margin-bottom: 20px;">
            <div style="width: 64px; height: 64px; background: ${iconBg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); font-size: 32px;">
              ${icon}
            </div>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; color: #1f2937; margin: 0 0 10px 0; text-align: center;">
            ${title}
          </h2>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 14px 0; text-align: center; line-height: 1.6;">
            ${message}
          </p>
          ${type !== "suspended" ? `<p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0; text-align: center; font-weight: 500;">${details}</p>` : ''}
          ${detailsHTML}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#4f46e5',
      showCancelButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      background: '#ffffff',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'rounded-3xl shadow-2xl',
        confirmButton: 'ios-confirm-button'
      },
      didOpen: (modal) => {
        const confirmButton = modal.querySelector('.swal2-confirm');
        if (confirmButton) {
          confirmButton.style.cssText = `
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 12px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
            transition: all 0.3s ease;
            margin-top: 20px;
          `;
          confirmButton.addEventListener('mouseenter', () => {
            confirmButton.style.transform = 'scale(1.05)';
            confirmButton.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.4)';
          });
          confirmButton.addEventListener('mouseleave', () => {
            confirmButton.style.transform = 'scale(1)';
            confirmButton.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.3)';
          });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validación básica
      if (!formData.username || !formData.password) {
        throw new Error("Por favor completa todos los campos");
      }

      if (formData.username.length < 3) {
        throw new Error(
          "El nombre de usuario debe tener al menos 3 caracteres"
        );
      }

      // Intentar login
      await login(formData);

      // Redirigir al dashboard sin mostrar alerta
      navigate("/");
    } catch (error) {
      const errorConfig = parseLoginError(error);
      showIOSAlert(errorConfig);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1e293b] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        ></div>
      </div>

      {/* Contenedor principal */}
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Logo arriba del formulario */}
        <div className="mb-6">
          <div className="w-full h-32 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-2 border border-white/20">
            <img
              src="https://i.imgur.com/Rouy0lF.png"
              alt="SL-SIPREB"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Usuario */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 pl-1"
              >
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-700/50 border-none rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                  placeholder="Ingresa tu usuario"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2 pl-1"
              >
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-12 py-3 bg-slate-700/50 border-none rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Credenciales de Demo dentro del card */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wide text-center">
              Credenciales de prueba
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="text-slate-300">
                <span className="text-slate-400">Usuario:</span>{" "}
                <span className="font-mono font-semibold text-indigo-400">
                  admin
                </span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="text-slate-300">
                <span className="text-slate-400">Contraseña:</span>{" "}
                <span className="font-mono font-semibold text-indigo-400">
                  admin123
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-xs text-slate-400">
            © 2024 Municipalidad de San Luis
          </p>
          <p className="text-xs text-slate-500 font-mono">
            v1.0.0
          </p>
        </div>
      </div>
    </div >
  );
}
