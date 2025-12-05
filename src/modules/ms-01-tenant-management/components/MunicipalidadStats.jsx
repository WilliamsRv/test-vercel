import React from 'react';

const StatCard = ({ title, value, icon, bgColor = 'bg-white', textColor = 'text-gray-800' }) => (
  <div className={`${bgColor} rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1`}>
    <div className="flex items-center justify-between mb-2">
      <div className={`${textColor} opacity-80 w-10 h-10 flex items-center justify-center rounded-full bg-white/30`}>
        {icon}
      </div>
      <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
    </div>
    <div className={`text-xs ${textColor} font-medium opacity-90`}>{title}</div>
  </div>
);

const MunicipalidadStats = ({ municipalidades }) => {
  // Calcular estadísticas
  const totalMunicipalidades = municipalidades.length;
  const municipalidadesActivas = municipalidades.filter(m => m.activo).length;
  const municipalidadesInactivas = municipalidades.filter(m => !m.activo).length;
  const municipalidadesProvinciales = municipalidades.filter(m => m.tipo === 'PROVINCIAL').length;
  const municipalidadesDistritales = municipalidades.filter(m => m.tipo === 'DISTRITAL').length;

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 mb-3">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <StatCard 
          title="Total Municipalidades" 
          value={totalMunicipalidades} 
          bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          textColor="text-white"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard 
          title="Activas" 
          value={municipalidadesActivas} 
          bgColor="bg-gradient-to-br from-green-500 to-green-600"
          textColor="text-white"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard 
          title="Inactivas" 
          value={municipalidadesInactivas} 
          bgColor="bg-gradient-to-br from-red-500 to-red-600"
          textColor="text-white"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard 
          title="Provinciales" 
          value={municipalidadesProvinciales} 
          bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          textColor="text-white"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />
        <StatCard 
          title="Distritales" 
          value={municipalidadesDistritales} 
          bgColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
          textColor="text-white"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          }
        />
      </div>
    </div>
  );
};

export default MunicipalidadStats;