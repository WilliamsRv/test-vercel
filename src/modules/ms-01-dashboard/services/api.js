export async function fetchDashboard(){
  // placeholder: en el futuro reemplazar por fetch a API real
  return Promise.resolve({ widgets: [
    { title: 'Bienes Activos', value: 314 },
    { title: 'Bienes en Baja', value: 173 },
  ]})
}
