import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MunicipalidadDetailModal = ({ isOpen, onClose, municipalidad }) => {
  if (!municipalidad) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" aria-hidden="true" />
          </Transition.Child>

          {/* Este elemento es para engañar al navegador para que centre el contenido del modal */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              {/* Encabezado */}
              <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">
                    Detalles de la Municipalidad
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información Básica */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Información Básica
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Nombre</label>
                        <p className="mt-1 text-base text-gray-900">{municipalidad.nombre}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">RUC</label>
                        <p className="mt-1 text-base text-gray-900">{municipalidad.ruc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Clasificación */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Clasificación
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Tipo de Municipalidad</label>
                        <span className={`mt-2 inline-block px-3 py-1 text-sm font-medium rounded-full ${
                          municipalidad.tipo === 'PROVINCIAL' ? 'bg-purple-100 text-purple-800' :
                          municipalidad.tipo === 'DISTRITAL' ? 'bg-blue-100 text-blue-800' :
                          municipalidad.tipo === 'CENTRO POBLADO' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {municipalidad.tipo}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Ubigeo</label>
                        <p className="mt-1 text-base text-gray-900">{municipalidad.ubigeo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Ubicación
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Dirección</label>
                        <p className="mt-1 text-base text-gray-900">{municipalidad.direccion || '-'}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Departamento</label>
                          <p className="mt-1 text-base text-gray-900">{municipalidad.departamento}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Provincia</label>
                          <p className="mt-1 text-base text-gray-900">{municipalidad.provincia}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Distrito</label>
                          <p className="mt-1 text-base text-gray-900">{municipalidad.distrito}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Contacto y Representante
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                        <p className="mt-1 text-base text-gray-900">{municipalidad.telefono || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Celular</label>
                        <p className="mt-1 text-base text-gray-900">{municipalidad.celular || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Correo Electrónico</label>
                        <p className="mt-1 text-base">
                          {municipalidad.email ? (
                            <a 
                              href={`mailto:${municipalidad.email}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {municipalidad.email}
                            </a>
                          ) : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Sitio Web</label>
                        <p className="mt-1 text-base">
                          {municipalidad.website ? (
                            <a 
                              href={municipalidad.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {municipalidad.website}
                            </a>
                          ) : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Alcalde</label>
                        <p className="mt-1 text-base text-gray-900">{municipalidad.alcalde || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MunicipalidadDetailModal;