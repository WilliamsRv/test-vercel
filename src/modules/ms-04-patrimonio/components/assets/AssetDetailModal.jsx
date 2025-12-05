import React, { useState, useEffect } from 'react';
import { getBienPatrimonialById } from '../../services/api';

/**
 * Modal para mostrar los detalles completos de un bien patrimonial
 */

export default function AssetDetailModal({ isOpen, onClose, bien, onEdit }) {
  if (!isOpen || !bien) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: bien.currency || bien.moneda || 'PEN',
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const InfoRow = ({ label, value, fullWidth = false }) => (
    <div className={`${fullWidth ? 'col-span-2' : ''}`}>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 font-semibold">{value || '-'}</dd>
    </div>
  );

  // --- listas / mapas para resolver ids a labels ---
  const [maps, setMaps] = useState({
    categorias: new Map(),
    areas: new Map(),
    proveedores: new Map(),
    responsables: new Map(),
    ubicaciones: new Map(),
  });

  // Simple resolved labels for the current `bien` (minimal logic requested)
  const [labels, setLabels] = useState({
    ubicacion: null,
    responsable: null,
    area: null,
    categoria: null,
  });

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const norm = (r) => {
      if (!r) return [];
      if (Array.isArray(r)) return r;
      if (r.data && Array.isArray(r.data)) return r.data;
      return [];
    };

    const toMap = (arr) => {
      const m = new Map();
      if (!arr) return m;
      // If backend returned a Map instance
      if (arr instanceof Map) {
        arr.forEach((v, k) => m.set(String(k), String(v)));
        return m;
      }
      // If backend returned a plain object like { id: 'Label', ... }
      if (!Array.isArray(arr) && typeof arr === 'object') {
        Object.entries(arr).forEach(([k, v]) => {
          if (k != null) m.set(String(k), v == null ? '' : String(v));
        });
        return m;
      }

      (arr || []).forEach((item) => {
        const id = item?.id ?? item?._id ?? item?.value ?? item?.codigo ?? item?.code ?? null;
        const key = id != null ? String(id) : null;
        const label = item?.label ?? item?.nombre ?? item?.razonSocial ?? item?.nombres ?? item?.name ?? item?.descripcion ?? item?.description ?? item?.codigo ?? item?.code ?? null;
        if (key) m.set(key, label || '');
      });
      return m;
    };

    (async () => {
      try {
        const [cats, areas, provs, resps, ubics] = await Promise.all([
          getCategorias().catch(() => []),
          getAreas().catch(() => []),
          getProveedores().catch(() => []),
          getResponsables().catch(() => []),
          getUbicaciones().catch(() => []),
        ]);

        if (!mounted) return;

        setMaps({
          categorias: toMap(norm(cats)),
          areas: toMap(norm(areas)),
          proveedores: toMap(norm(provs)),
          responsables: toMap(norm(resps)),
          ubicaciones: toMap(norm(ubics)),
        });
      } catch (err) {
        console.error('Error cargando listas para detalle:', err);
      }
    })();

    return () => { mounted = false; };
  }, [isOpen]);
  console.log('Mapas cargados:', maps);

  // When maps or bien change, try a minimal lookup: if the bien has an id for ubicacion/responsable/area,
  // find the matching entry in the corresponding map and store the label.
  useEffect(() => {
    if (!bien) return;
    const tryGet = (id, mapsToCheck = []) => {
      if (id === null || id === undefined) return null;
      const k = String(id);
      for (const m of mapsToCheck) {
        if (!m) continue;
        const v = m.get(k);
        if (v) return v;
      }
      return null;
    };

    const ubicId = bien.ubicacionActual ?? bien.ubicacion ?? bien.ubicacionId ?? bien.ubicacion_id;
    const respId = bien.responsableActual ?? bien.responsable ?? bien.responsableId ?? bien.responsable_id;
    const areaId = bien.areaAsignada ?? bien.area ?? bien.areaId ?? bien.area_id;
    const catId = bien.categoria ?? bien.categoriaId ?? bien.categoria_id ?? bien.categoria?.id;

    setLabels({
      ubicacion: tryGet(ubicId, [maps.ubicaciones, maps.areas]) || null,
      responsable: tryGet(respId, [maps.responsables, maps.proveedores]) || null,
      area: tryGet(areaId, [maps.areas]) || null,
      categoria: tryGet(catId, [maps.categorias]) || null,
    });
  }, [maps, bien]);

  const findLabel = (val, candidateMaps = []) => {
    if (val === null || val === undefined) return null;
    // object with label-like fields
    if (typeof val === 'object') {
      const s = val?.label ?? val?.nombre ?? val?.nombres ?? val?.razonSocial ?? val?.name ?? val?.descripcion ?? val?.codigo ?? val?.code ?? null;
      if (s) return s;
      const id = val?.id ?? val?._id ?? val?.value ?? val?.codigo ?? val?.code;
      if (id != null) {
        const k = String(id);
        for (const m of candidateMaps) {
          if (!m) continue;
          const found = m.get(k);
          if (found) return found;
        }
      }
      return null;
    }

    // primitive: try maps first
    const key = String(val);
    for (const m of candidateMaps) {
      if (!m) continue;
      const found = m.get(key);
      if (found) return found;
    }

    // If value contains letters, treat as human label
    if (/[A-Za-z\u00C0-\u024F]/.test(key)) return key;
    return null;
  };

  // Recursively search an object/array for a primitive that matches any candidate map key
  const extractKeyFromObject = (obj, candidateMaps = []) => {
    if (obj == null) return null;
    if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
    if (Array.isArray(obj)) {
      for (const v of obj) {
        const r = extractKeyFromObject(v, candidateMaps);
        if (r) return r;
      }
      return null;
    }
    // object: check common id fields first
    const idFields = ['id', '_id', 'value', 'codigo', 'code', 'responsableId', 'ubicacionId', 'areaId'];
    for (const f of idFields) {
      if (obj[f] != null) return String(obj[f]);
    }
    // then deep search
    for (const k of Object.keys(obj)) {
      try {
        const v = obj[k];
        if (v == null) continue;
        if (typeof v === 'string' || typeof v === 'number') {
          const s = String(v);
          // if this primitive exists in any candidate map, return it
          for (const m of candidateMaps) {
            if (m && m.has(s)) return s;
          }
          // otherwise if it contains letters, return it as label
          if (/[A-Za-z\u00C0-\u024F]/.test(s)) return s;
        }
        if (typeof v === 'object') {
          const r = extractKeyFromObject(v, candidateMaps);
          if (r) return r;
        }
      } catch (e) {
        // ignore circular structures
      }
    }
    return null;
  };

  const anyMapLoaded = (candidateMaps = []) => candidateMaps.some(m => m && m.size > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Detalle del Bien Patrimonial
                </h3>
                <p className="text-slate-300 text-sm">
                  Código: {bien.assetCode || bien.codigoPatrimonial}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Información Principal */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <h4 className="text-xl font-bold text-slate-800 mb-4">
                {bien.description || bien.descripcion}
              </h4>
              {bien.detalles && (
                <p className="text-slate-600 text-sm">{bien.detalles}</p>
              )}
              <div className="mt-4 flex gap-3">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  (bien.assetStatus || bien.estadoBien) === 'DISPONIBLE' ? 'bg-green-100 text-green-800' :
                  (bien.assetStatus || bien.estadoBien) === 'EN_USO' ? 'bg-blue-100 text-blue-800' :
                  (bien.assetStatus || bien.estadoBien) === 'MANTENIMIENTO' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {bien.assetStatus || bien.estadoBien}
                </span>
                {(bien.conservationStatus || bien.estadoFisico) && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                    {bien.conservationStatus || bien.estadoFisico}
                  </span>
                )}
              </div>
            </div>

            {/* Características Técnicas */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Características Técnicas
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Marca" value={bien.brand || bien.marca} />
                <InfoRow label="Modelo" value={bien.model || bien.modelo} />
                <InfoRow label="Serie" value={bien.serialNumber || bien.serie} />
                <InfoRow label="Color" value={bien.color} />
                <InfoRow label="Dimensiones" value={bien.dimensions || bien.dimensiones} fullWidth />
                <InfoRow label="Peso" value={(bien.weight || bien.peso) ? `${bien.weight || bien.peso} kg` : '-'} />
              </dl>
            </div>

            {/* Información Financiera */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información Financiera
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Fecha de Adquisición" value={formatDate(bien.acquisitionDate || bien.fechaAdquisicion)} />
                <InfoRow label="Valor de Adquisición" value={formatCurrency(bien.acquisitionValue || bien.valorAdquisicion)} />
                <InfoRow label="Valor Actual" value={formatCurrency(bien.currentValue || bien.valorActual)} />
                <InfoRow label="Valor Residual" value={formatCurrency(bien.residualValue || bien.valorResidual)} />
                <InfoRow label="Vida Útil" value={(bien.usefulLife || bien.vidaUtil) ? `${bien.usefulLife || bien.vidaUtil} meses` : '-'} />
                <InfoRow label="Método Depreciación" value={bien.metodoDepreciacion} />
                <InfoRow label="Depreciable" value={(bien.isDepreciable ?? bien.esDepreciable) ? 'Sí' : 'No'} />
                <InfoRow label="Moneda" value={bien.currency || bien.moneda} />
              </dl>
            </div>

            {/* Ubicación y Responsabilidad */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ubicación y Responsabilidad
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Ubicación Actual" value={ labels.ubicacion || findLabel(bien.ubicacionActual, [maps.ubicaciones, maps.areas]) || findLabel(bien.ubicacion, [maps.ubicaciones, maps.areas]) || String(bien.ubicacionActual || bien.ubicacion || '-') } />
                <InfoRow label="Ubicación Física" value={bien.ubicacionFisica} />
                <InfoRow label="Responsable" value={ labels.responsable || findLabel(bien.responsableActual, [maps.responsables, maps.proveedores]) || findLabel(bien.responsable, [maps.responsables, maps.proveedores]) || String(bien.responsableActual || bien.responsable || '-') } />
                <InfoRow label="Área Asignada" value={ labels.area || findLabel(bien.areaAsignada, [maps.areas]) || findLabel(bien.area, [maps.areas]) || String(bien.areaAsignada || bien.area || '-') } />
                <InfoRow label="Condición de Uso" value={bien.condicionUso} fullWidth />
              </dl>
            </div>

            {/* Documentación */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documentación
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4 mb-4">
                <InfoRow label="N° Factura" value={bien.invoiceNumber || bien.facturaNumero || bien.numeroFactura} />
                <InfoRow label="Orden de Compra" value={bien.purchaseOrderNumber || bien.ordenCompra || bien.numeroOrdenCompra} />
                <InfoRow label="Vencimiento Garantía" value={formatDate(bien.warrantyExpirationDate || bien.fechaVencimientoGarantia)} />
              </dl>

              {/* Archivos Adjuntos */}
              {bien.attachedDocuments && (() => {
                try {
                  const docs = typeof bien.attachedDocuments === 'string' 
                    ? JSON.parse(bien.attachedDocuments) 
                    : bien.attachedDocuments;
                  
                  if (Array.isArray(docs) && docs.length > 0) {
                    return (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Archivos Adjuntos ({docs.length}):
                        </p>
                        <div className="space-y-2">
                          {docs.map((doc, index) => (
                            <a
                              key={index}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition group"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {doc.fileType?.includes('pdf') ? (
                                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                  </svg>
                                ) : doc.fileType?.includes('image') ? (
                                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600">
                                    {doc.fileName}
                                  </p>
                                  {doc.fileSize && (
                                    <p className="text-xs text-slate-500">
                                      {(doc.fileSize / 1024).toFixed(2)} KB
                                    </p>
                                  )}
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('Error parsing attachedDocuments:', e);
                }
                return null;
              })()}
            </div>

            {/* Identificadores */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Identificadores
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Código QR" value={bien.qrCode || bien.codigoQr} />
                <InfoRow label="Código de Barras" value={bien.barcode || bien.codigoBarras} />
                <InfoRow label="Etiqueta RFID" value={bien.rfidTag || bien.etiquetaRfid} />
              </dl>
            </div>

            {/* Mantenimiento */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Información de Mantenimiento
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Requiere Mantenimiento" value={(bien.requiresMaintenance ?? bien.requiereMantenimiento) ? 'Sí' : 'No'} />
              </dl>
            </div>

            {/* Observaciones */}
            {(bien.observations || bien.observaciones) && (
              <div className="mb-4">
                <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Observaciones
                </h5>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 text-sm">{bien.observations || bien.observaciones}</p>
                </div>
              </div>
            )}

            {/* Metadatos */}
            <div className="border-t pt-4">
              <dl className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                <InfoRow label="Fecha de Ingreso" value={formatDate(bien.entryDate || bien.fechaIngreso)} />
                <InfoRow label="Creado el" value={formatDate(bien.createdAt)} />
                <InfoRow label="Última actualización" value={formatDate(bien.updatedAt)} />
                <InfoRow label="Versión" value={bien.version} />
              </dl>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-between border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
            >
              Cerrar
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(bien);
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
