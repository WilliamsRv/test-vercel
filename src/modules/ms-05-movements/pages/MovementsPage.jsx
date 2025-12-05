import { useState, useEffect } from 'react';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import MovementsList from '../components/movements/MovementsList';
import MovementForm from '../components/movements/MovementForm';
import MovementDetails from '../components/movements/MovementDetails';
import { useAssetMovements } from '../hooks/useAssetMovements';
import assetMovementService from '../services/assetMovementService';
import userService from '../../ms-02-authentication/services/userService';
import personService from '../../ms-02-authentication/services/personService';
import { getBienesPatrimoniales, cambiarEstadoBien } from '../../ms-04-patrimonio/services/api';
import { getAllAreas } from '../../ms-03-configuration/services/areasApi';
import { getAllPhysicalLocations } from '../../ms-03-configuration/services/physicalLocationApi';
import { MovementStatus, MovementType } from '../types/movementTypes';

export default function MovementsPage() {
  // UUID del municipio - usar el mismo que en Postman
  // TODO: En el futuro obtenerlo del contexto de usuario o localStorage
  const municipalityId = '24ad12a5-d9e5-4cdd-91f1-8fd0355c9473';
  
  const {
    movements,
    loading,
    error,
    loadMovements,
    createMovement,
    updateMovement,
    deleteMovement,
    restoreMovement,
    approveMovement,
    rejectMovement,
    markInProcess,
    completeMovement,
    cancelMovement
  } = useAssetMovements(municipalityId);

  const [deletedMovements, setDeletedMovements] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('active'); // 'all', 'active', 'inactive'
  const [users, setUsers] = useState([]);
  const [persons, setPersons] = useState([]);
  const [assets, setAssets] = useState([]);
  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar datos necesarios para el formulario
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Cargar usuarios (para Usuario Solicitante y Usuario Ejecutor)
        try {
          console.log('🔄 Loading users...');
          const userData = await userService.getAllUsers();
          console.log('📦 Raw user data from API:', userData);
          console.log('📦 Is array?', Array.isArray(userData));
          
          // Manejar diferentes formatos de respuesta
          let usersArray = [];
          if (Array.isArray(userData)) {
            usersArray = userData;
          } else if (userData && Array.isArray(userData.data)) {
            usersArray = userData.data;
          } else if (userData && userData.content && Array.isArray(userData.content)) {
            usersArray = userData.content;
          } else if (userData && typeof userData === 'object') {
            // Si es un objeto único, convertirlo a array
            usersArray = [userData];
          }
          
          console.log('📦 Processed users array:', usersArray);
          console.log('📦 First user sample:', usersArray[0]);
          
          // Filtrar solo usuarios activos (pero ser más permisivo si no hay campo de estado)
          const activeUsers = usersArray.filter(user => {
            // Si no hay campo de estado, incluir el usuario (asumir que está activo)
            const status = user.status || user.userStatus || user.state;
            const active = user.active !== undefined ? user.active : undefined;
            
            // Si no hay información de estado, incluir el usuario
            if (status === undefined && active === undefined) {
              return true;
            }
            
            // Si hay información de estado, filtrar por activos
            return status === 'ACTIVE' || 
                   active === true || 
                   (status !== 'INACTIVE' && status !== 'SUSPENDED' && status !== 'BLOCKED' && status !== 'INACTIVO');
          });
          
          console.log('✅ Users loaded:', activeUsers.length, 'active users out of', usersArray.length, 'total');
          if (activeUsers.length > 0) {
            console.log('✅ Sample active user:', activeUsers[0]);
            console.log('✅ User structure:', Object.keys(activeUsers[0]));
            setUsers(activeUsers);
          } else if (usersArray.length > 0) {
            console.warn('⚠️ No active users found, but there are', usersArray.length, 'total users');
            console.warn('⚠️ First user sample (to check structure):', usersArray[0]);
            // Si no hay usuarios activos pero hay usuarios, mostrar todos (puede ser un problema de formato)
            console.log('⚠️ Showing all users as fallback');
            setUsers(usersArray);
          } else {
            console.warn('⚠️ No users found at all');
            setUsers([]);
          }
        } catch (error) {
          console.error('❌ Error loading users:', error);
          console.error('❌ Error details:', error.message, error.stack);
          setUsers([]);
        }

        // Cargar personas (para Responsable Origen y Responsable Destino)
        try {
          console.log('🔄 Loading persons for municipality:', municipalityId);
          
          // Esperar un momento para asegurar que el token esté disponible
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Obtener token para verificar autenticación
          const token = localStorage.getItem('accessToken');
          if (!token) {
            console.warn('⚠️ No token found in localStorage - persons may not load correctly');
          }
          
          console.log('📡 Fetching persons from personService...');
          console.log('📡 Has token:', !!token);
          
          // Intentar primero con getActivePersons, luego con getAllPersons como fallback
          let personData = null;
          try {
            console.log('📡 Trying getActivePersons() first...');
            personData = await personService.getActivePersons();
            console.log('✅ getActivePersons() succeeded');
          } catch (activeError) {
            console.warn('⚠️ getActivePersons() failed, trying getAllPersons()...', activeError.message);
            try {
              personData = await personService.getAllPersons();
              console.log('✅ getAllPersons() succeeded');
            } catch (allError) {
              console.error('❌ Both getActivePersons() and getAllPersons() failed');
              throw allError;
            }
          }
          
          console.log('📦 Raw person data from API:', personData);
          console.log('📦 Data type:', typeof personData);
          console.log('📦 Is array?', Array.isArray(personData));
          
          // Manejar diferentes formatos de respuesta (similar a users)
          let personsArray = [];
          if (Array.isArray(personData)) {
            personsArray = personData;
            console.log('✅ Data is direct array');
          } else if (personData && Array.isArray(personData.data)) {
            personsArray = personData.data;
            console.log('✅ Data is in .data property');
          } else if (personData && personData.content && Array.isArray(personData.content)) {
            personsArray = personData.content;
            console.log('✅ Data is in .content property');
          } else if (personData && typeof personData === 'object' && personData !== null) {
            personsArray = [personData];
            console.log('✅ Data is single object, converted to array');
          } else {
            console.warn('⚠️ Unexpected data format:', personData);
            personsArray = [];
          }
          
          console.log('📦 Processed persons array:', personsArray.length, 'persons');
          
          // Filtrar por municipio si las personas tienen municipalityId
          if (municipalityId && personsArray.length > 0) {
            const personsByMunicipality = personsArray.filter(person => {
              const personMunicipalityId = person.municipalityId || person.municipalCode || person.municipality;
              return !personMunicipalityId || personMunicipalityId === municipalityId;
            });
            
            if (personsByMunicipality.length > 0) {
              console.log(`✅ Persons filtered by municipalityId (${municipalityId}):`, personsByMunicipality.length, 'out of', personsArray.length, 'total');
              personsArray = personsByMunicipality;
            } else {
              console.warn(`⚠️ No persons found for municipalityId ${municipalityId}, showing all persons as fallback`);
            }
          }
          
          if (personsArray.length > 0) {
            console.log('📦 First person sample:', personsArray[0]);
            console.log('📦 First person keys:', Object.keys(personsArray[0]));
          }
          
          // Filtrar solo personas activas (pero ser más permisivo si no hay campo de estado)
          const activePersons = personsArray.filter(person => {
            // Si no hay campo de estado, incluir la persona (asumir que está activa)
            const status = person.status || person.personStatus || person.state;
            const active = person.active !== undefined ? person.active : undefined;
            
            // Si no hay información de estado, incluir la persona
            if (status === undefined && active === undefined) {
              return true;
            }
            
            // Si hay información de estado, filtrar por activas
            return status === 'ACTIVE' || 
                   active === true || 
                   (status !== 'INACTIVE' && status !== 'SUSPENDED' && status !== 'BLOCKED' && status !== 'INACTIVO');
          });
          
          console.log('✅ Persons loaded:', activePersons.length, 'active persons out of', personsArray.length, 'total');
          
          if (activePersons.length > 0) {
            console.log('✅ Sample active person:', activePersons[0]);
            console.log('✅ Person structure:', Object.keys(activePersons[0]));
            setPersons(activePersons);
          } else if (personsArray.length > 0) {
            console.warn('⚠️ No active persons found, but there are', personsArray.length, 'total persons');
            console.warn('⚠️ First person sample (to check structure):', personsArray[0]);
            console.warn('⚠️ Person statuses found:', personsArray.map(p => p.status || p.personStatus || p.state || p.active).filter(Boolean));
            // Si no hay personas activas pero hay personas, mostrar todas (puede ser un problema de formato)
            console.log('⚠️ Showing all persons as fallback');
            setPersons(personsArray);
          } else {
            console.warn('⚠️ No persons found at all');
            console.warn('⚠️ This could be due to:');
            console.warn('   - No persons exist in the system');
            console.warn('   - Authentication token issue');
            console.warn('   - API endpoint issue');
            setPersons([]);
          }
        } catch (error) {
          console.error('❌ Error loading persons:', error);
          console.error('❌ Error details:', error.message);
          console.error('❌ Error stack:', error.stack);
          setPersons([]);
        }

        // Cargar activos desde el servicio de patrimonio
        // Endpoint correcto: http://localhost:5003/api/v1/assets
        try {
          console.log('🔄 Loading assets for municipality:', municipalityId);
          
          // Esperar un momento para asegurar que el token esté disponible
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Obtener token para autenticación
          const token = localStorage.getItem('accessToken');
          
          if (!token) {
            console.warn('⚠️ No token found in localStorage - assets may not load correctly');
          }
          
          // Endpoint correcto para listar bienes patrimoniales (con /v1)
          const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5003/api/v1';
          const ASSETS_API_URL = `${API_BASE}/assets`;
          
          // Si hay municipalityId, agregarlo como query parameter
          const urlWithParams = municipalityId 
            ? `${ASSETS_API_URL}?municipalityId=${municipalityId}`
            : ASSETS_API_URL;
          
          console.log('📡 Fetching assets from:', urlWithParams);
          console.log('📡 Has token:', !!token);
          console.log('📡 Municipality ID:', municipalityId);
          
          // Hacer la petición con autenticación
          const headers = {
            'Content-Type': 'application/json',
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('✅ Token added to headers');
          }
          
          const response = await fetch(urlWithParams, {
            method: 'GET',
            headers: headers
          });
          
          console.log('📥 Response status:', response.status, response.statusText);
          console.log('📥 Response ok:', response.ok);
          
          if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
              const errorData = await response.json();
              console.error('❌ Error response (JSON):', errorData);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
              const errorText = await response.text();
              console.error('❌ Error response (text):', errorText);
              if (errorText) {
                errorMessage = errorText.substring(0, 200);
              }
            }
            throw new Error(errorMessage);
          }
          
          // Parsear la respuesta JSON
          const assetData = await response.json();
          console.log('📦 Raw asset data from API:', assetData);
          console.log('📦 Data type:', typeof assetData);
          console.log('📦 Is array?', Array.isArray(assetData));
          
          // Manejar diferentes formatos de respuesta
          let assetsArray = [];
          if (Array.isArray(assetData)) {
            assetsArray = assetData;
            console.log('✅ Data is direct array');
          } else if (assetData && Array.isArray(assetData.data)) {
            assetsArray = assetData.data;
            console.log('✅ Data is in .data property');
          } else if (assetData && assetData.content && Array.isArray(assetData.content)) {
            assetsArray = assetData.content;
            console.log('✅ Data is in .content property');
          } else if (assetData && typeof assetData === 'object' && assetData !== null) {
            assetsArray = [assetData];
            console.log('✅ Data is single object, converted to array');
          } else {
            console.warn('⚠️ Unexpected data format:', assetData);
            assetsArray = [];
          }
          
          console.log('📦 Processed assets array:', assetsArray.length, 'assets');
          
          // Filtrar por municipio si los activos tienen municipalityId
          if (municipalityId && assetsArray.length > 0) {
            const assetsByMunicipality = assetsArray.filter(asset => {
              const assetMunicipalityId = asset.municipalityId || asset.municipalCode || asset.municipality;
              return assetMunicipalityId === municipalityId;
            });
            
            if (assetsByMunicipality.length > 0) {
              console.log(`✅ Assets filtered by municipalityId (${municipalityId}):`, assetsByMunicipality.length, 'out of', assetsArray.length, 'total');
              assetsArray = assetsByMunicipality;
            } else {
              console.warn(`⚠️ No assets found for municipalityId ${municipalityId}, showing all assets as fallback`);
            }
          }
          
          if (assetsArray.length > 0) {
            console.log('📦 First asset sample:', assetsArray[0]);
            console.log('📦 First asset keys:', Object.keys(assetsArray[0]));
          }
          
          // Filtrar solo activos que pueden ser movidos:
          // - DISPONIBLE (disponibles, no en uso)
          // - IN_USE o EN_USO (en uso)
          const availableAssets = assetsArray.filter(asset => {
            const status = asset.assetStatus || asset.estadoBien || asset.status || '';
            if (!status) {
              return true; // Si no hay estado, incluir
            }
            return status === 'DISPONIBLE' || status === 'IN_USE' || status === 'EN_USO';
          });
          
          console.log('✅ Assets loaded:', availableAssets.length, 'available out of', assetsArray.length, 'total');
          
          if (availableAssets.length > 0) {
            console.log('✅ Setting assets to state:', availableAssets.length);
            setAssets(availableAssets);
          } else if (assetsArray.length > 0) {
            // Si hay activos pero ninguno pasa el filtro, mostrar todos
            console.warn('⚠️ No assets passed filter, showing all as fallback');
            console.warn('⚠️ Total assets:', assetsArray.length);
            console.warn('⚠️ Asset statuses found:', assetsArray.map(a => a.assetStatus || a.estadoBien || a.status).filter(Boolean));
            setAssets(assetsArray);
          } else {
            console.warn('⚠️ No assets received from API');
            console.warn('⚠️ This could be due to:');
            console.warn('   - No assets exist for this municipality');
            console.warn('   - Authentication token issue');
            console.warn('   - API endpoint issue');
            setAssets([]);
          }
        } catch (error) {
          console.error('❌ Error loading assets:', error);
          console.error('❌ Error details:', error.message);
          console.error('❌ Error stack:', error.stack);
          setAssets([]);
        }

        // Cargar áreas desde el servicio de configuración
        try {
          console.log('🔄 Loading areas for municipality:', municipalityId);
          const areaData = await getAllAreas();
          console.log('📦 Areas received from API:', areaData);
          
          // Filtrar por municipalityId si está disponible en los datos
          let filteredAreas = Array.isArray(areaData) ? areaData : [];
          
          if (filteredAreas.length === 0) {
            console.warn('⚠️ No areas received from API');
            setAreas([]);
          } else {
            // Si las áreas tienen municipalityId, intentar filtrar
            if (filteredAreas[0].municipalityId) {
              const areasByMunicipality = filteredAreas.filter(area => 
                area.municipalityId === municipalityId
              );
              
              if (areasByMunicipality.length > 0) {
                // Filtrar solo las activas del municipio
                filteredAreas = areasByMunicipality.filter(area => area.active !== false);
                console.log(`✅ Areas filtered by municipalityId (${municipalityId}):`, filteredAreas.length);
              } else {
                // Si no hay áreas para este municipio, mostrar todas las activas como fallback
                console.warn(`⚠️ No areas found for municipalityId ${municipalityId}, showing all active areas`);
                filteredAreas = filteredAreas.filter(area => area.active !== false);
                console.log('✅ Using all active areas as fallback:', filteredAreas.length);
              }
            } else {
              // Si no tienen municipalityId, usar todas las activas
              filteredAreas = filteredAreas.filter(area => area.active !== false);
              console.log('✅ Using all active areas (no municipalityId filter):', filteredAreas.length);
            }
            
            setAreas(filteredAreas);
          }
        } catch (error) {
          console.error('❌ Error loading areas:', error);
          console.error('Error details:', error.message);
          setAreas([]);
        }

        // Cargar ubicaciones físicas desde el servicio de configuración
        try {
          console.log('🔄 Loading physical locations for municipality:', municipalityId);
          const locationData = await getAllPhysicalLocations();
          console.log('📦 Physical locations received from API:', locationData);
          
          // Filtrar por municipalityId si está disponible en los datos
          let filteredLocations = Array.isArray(locationData) ? locationData : [];
          
          if (filteredLocations.length === 0) {
            console.warn('⚠️ No physical locations received from API');
            setLocations([]);
          } else {
            // Si las ubicaciones tienen municipalityId, intentar filtrar
            if (filteredLocations[0].municipalityId) {
              const locationsByMunicipality = filteredLocations.filter(location => 
                location.municipalityId === municipalityId
              );
              
              if (locationsByMunicipality.length > 0) {
                // Filtrar solo las activas del municipio
                filteredLocations = locationsByMunicipality.filter(location => location.active !== false);
                console.log(`✅ Physical locations filtered by municipalityId (${municipalityId}):`, filteredLocations.length);
              } else {
                // Si no hay ubicaciones para este municipio, mostrar todas las activas como fallback
                console.warn(`⚠️ No physical locations found for municipalityId ${municipalityId}, showing all active locations`);
                filteredLocations = filteredLocations.filter(location => location.active !== false);
                console.log('✅ Using all active physical locations as fallback:', filteredLocations.length);
              }
            } else {
              // Si no tienen municipalityId, usar todas las activas
              filteredLocations = filteredLocations.filter(location => location.active !== false);
              console.log('✅ Using all active physical locations (no municipalityId filter):', filteredLocations.length);
            }
            
            setLocations(filteredLocations);
          }
        } catch (error) {
          console.error('❌ Error loading physical locations:', error);
          console.error('Error details:', error.message);
          setLocations([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [municipalityId]);

  const handleCreateNew = () => {
    setSelectedMovement(null);
    setShowForm(true);
  };

  const handleEdit = (movement) => {
    console.log('✏️ Opening edit form for movement:', movement);
    console.log('✏️ Current assets count:', assets.length);
    console.log('✏️ Current loadingData:', loadingData);
    setSelectedMovement(movement);
    setShowForm(true);
  };

  const handleView = (movement) => {
    setSelectedMovement(movement);
    setShowDetails(true);
  };

  const handleFormSave = async (movementData) => {
    try {
      if (selectedMovement) {
        // Actualizar movimiento existente - llamar al servicio de API
        console.log('🔄 Updating movement:', selectedMovement.id, movementData);
        
        // Preparar solo los campos que deben actualizarse (excluir campos de auditoría, fechas y campos no actualizables)
        // NOTA: movementNumber es opcional en actualizaciones (el backend ya no lo requiere)
        // movementNumber es inmutable después de la creación, por lo que no se incluye en el payload
        const updateData = {
          // Campo requerido por validación del backend
          municipalityId: movementData.municipalityId || municipalityId,
          
          // Campos básicos actualizables (movementNumber es opcional y no se incluye)
          assetId: movementData.assetId,
          movementType: movementData.movementType,
          movementSubtype: movementData.movementSubtype || null,
          
          // Responsables y ubicaciones
          originResponsibleId: movementData.originResponsibleId || null,
          destinationResponsibleId: movementData.destinationResponsibleId || null,
          originAreaId: movementData.originAreaId || null,
          destinationAreaId: movementData.destinationAreaId || null,
          originLocationId: movementData.originLocationId || null,
          destinationLocationId: movementData.destinationLocationId || null,
          
          // Información del movimiento
          reason: movementData.reason,
          observations: movementData.observations || null,
          specialConditions: movementData.specialConditions || null,
          supportingDocumentNumber: movementData.supportingDocumentNumber || null,
          supportingDocumentType: movementData.supportingDocumentType || null,
          // attachedDocuments es JSONB: si es null, vacío o string vacío, usar null (el backend lo convertirá a [])
          attachedDocuments: (() => {
            const docs = movementData.attachedDocuments;
            if (!docs || docs === '' || (Array.isArray(docs) && docs.length === 0)) {
              return null;
            }
            // Si es un string, intentar parsearlo como JSON
            if (typeof docs === 'string') {
              try {
                const parsed = JSON.parse(docs);
                return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
              } catch {
                return null;
              }
            }
            // Si es un array, retornarlo
            return Array.isArray(docs) && docs.length > 0 ? docs : null;
          })(),
          
          // Configuración y estado
          requiresApproval: movementData.requiresApproval !== undefined ? movementData.requiresApproval : true,
          movementStatus: movementData.movementStatus || selectedMovement.movementStatus,
          
          // Usuarios
          requestingUser: movementData.requestingUser,
          executingUser: movementData.executingUser || null
        };
        
        // Eliminar campos undefined, null o vacíos que puedan causar problemas
        // También excluir campos que no deben actualizarse
        // movementNumber es opcional en actualizaciones y no se incluye (es inmutable después de la creación)
        const fieldsToExclude = ['id', 'movementNumber', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'deletedAt', 'deletedBy'];
        const nullableFields = [
          'movementSubtype', 
          'observations', 
          'specialConditions', 
          'supportingDocumentNumber', 
          'supportingDocumentType', 
          'attachedDocuments', 
          'executingUser',
          'originResponsibleId',
          'destinationResponsibleId',
          'originAreaId',
          'destinationAreaId',
          'originLocationId',
          'destinationLocationId'
        ];
        
        Object.keys(updateData).forEach(key => {
          // Excluir campos que no deben actualizarse
          if (fieldsToExclude.includes(key)) {
            delete updateData[key];
            return;
          }
          
          // Manejar campos undefined o vacíos
          if (updateData[key] === undefined || updateData[key] === '') {
            if (nullableFields.includes(key)) {
              // Campos opcionales: convertir vacío a null
              updateData[key] = null;
            } else {
              // Campos requeridos: eliminar si están vacíos (se usarán valores del movimiento original)
              delete updateData[key];
            }
          }
        });
        
        // Asegurarse de que todos los valores requeridos estén presentes
        if (!updateData.municipalityId) {
          updateData.municipalityId = municipalityId;
        }
        // NO incluir movementNumber - es generado automáticamente y no debe actualizarse
        if (!updateData.assetId) {
          updateData.assetId = selectedMovement.assetId;
        }
        if (!updateData.movementType) {
          updateData.movementType = selectedMovement.movementType;
        }
        if (!updateData.reason) {
          updateData.reason = selectedMovement.reason || '';
        }
        if (!updateData.requestingUser) {
          updateData.requestingUser = selectedMovement.requestingUser;
        }
        
        console.log('📤 Update data to send:', JSON.stringify(updateData, null, 2));
        console.log('📤 Update data keys:', Object.keys(updateData));
        const updated = await assetMovementService.updateMovement(
          selectedMovement.id,
          municipalityId,
          updateData
        );
        console.log('✅ Movement updated:', updated);
        // Actualizar el estado local
        updateMovement(updated);
        // Recargar la lista para asegurar sincronización
        await loadMovements();
      } else {
        // Crear nuevo movimiento
        console.log('💾 Creating new movement with data:', movementData);
        console.log('💾 Movement type value:', movementData.movementType);
        console.log('💾 Full movement data:', JSON.stringify(movementData, null, 2));
        
        // Preparar datos para crear - EXCLUIR movementNumber (se genera automáticamente)
        const createData = {
          ...movementData,
          municipalityId: movementData.municipalityId || municipalityId,
          // NO incluir movementNumber - se genera automáticamente en el backend
          // Asegurar que requiresApproval tenga un valor por defecto
          requiresApproval: movementData.requiresApproval !== undefined ? movementData.requiresApproval : true,
        };
        
        // Eliminar movementNumber si existe (no debe enviarse)
        delete createData.movementNumber;
        
        // Manejar attachedDocuments como JSONB (array JSON o null)
        createData.attachedDocuments = (() => {
          const docs = movementData.attachedDocuments;
          if (!docs || docs === '' || (Array.isArray(docs) && docs.length === 0)) {
            return null; // El backend lo convertirá a [] si es necesario
          }
          // Si es un string, intentar parsearlo como JSON
          if (typeof docs === 'string') {
            try {
              const parsed = JSON.parse(docs);
              return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
            } catch {
              return null;
            }
          }
          // Si es un array, retornarlo
          return Array.isArray(docs) && docs.length > 0 ? docs : null;
        })();
        
        console.log('💾 Final data to send (sin movementNumber):', JSON.stringify(createData, null, 2));
        const newMovement = await createMovement(createData);
        console.log('✅ Movement created successfully:', newMovement);
        
        // Actualizar el estado del bien a "EN_USO" cuando se crea un movimiento
        if (newMovement.assetId || createData.assetId) {
          const assetId = newMovement.assetId || createData.assetId;
          try {
            console.log('🔄 Updating asset status to EN_USO for asset:', assetId);
            await cambiarEstadoBien(
              assetId,
              'EN_USO',
              `Movimiento creado: ${newMovement.movementNumber || 'N/A'}`
            );
            console.log('✅ Asset status updated to EN_USO successfully');
          } catch (assetError) {
            // No bloquear el flujo si falla la actualización del estado del bien
            console.error('❌ Error updating asset status:', assetError);
            console.warn('⚠️ Movement was created but asset status could not be updated');
          }
        } else {
          console.warn('⚠️ No assetId found in movement, skipping asset status update');
        }
        
        // Mostrar mensaje de éxito con el número generado
        if (newMovement.movementNumber) {
          Swal.fire({
            title: '¡Movimiento creado!',
            html: `
              <div class="text-center">
                <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="text-slate-600 mb-2">El movimiento fue creado exitosamente.</p>
                <p class="text-lg font-semibold text-slate-800">Número de Movimiento: <span class="text-blue-600">${newMovement.movementNumber}</span></p>
              </div>
            `,
            icon: null,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Aceptar',
            timer: 3000,
            timerProgressBar: true,
            customClass: {
              popup: 'rounded-2xl shadow-2xl border border-slate-200',
              title: 'text-2xl font-bold text-slate-900 mb-4',
              htmlContainer: 'text-slate-600',
              confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
            },
          });
        }
        
        // Recargar la lista para asegurar que se muestre el nuevo movimiento
        console.log('🔄 Reloading movements list...');
        await loadMovements();
        console.log('✅ Movements list reloaded');
      }
      setShowForm(false);
      setSelectedMovement(null);
    } catch (error) {
      console.error('❌ Error saving movement:', error);
      throw error; // Re-lanzar el error para que el formulario lo maneje
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedMovement(null);
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedMovement(null);
  };

  const handleApprove = async (id, approvedBy) => {
    try {
      await approveMovement(id, approvedBy);
      loadMovements();
    } catch (error) {
      throw error;
    }
  };

  const handleReject = async (id, approvedBy, rejectionReason) => {
    try {
      // Obtener el movimiento antes de rechazarlo para tener el assetId
      const movement = await assetMovementService.getMovementById(id, municipalityId);
      const assetId = movement?.assetId;
      
      await rejectMovement(id, approvedBy, rejectionReason);
      
      // Si el movimiento tenía un bien asociado, liberarlo (cambiar a DISPONIBLE)
      if (assetId) {
        try {
          console.log('🔄 Liberating asset (rejecting movement) - updating to DISPONIBLE for asset:', assetId);
          await cambiarEstadoBien(
            assetId,
            'DISPONIBLE',
            `Movimiento rechazado: ${movement?.movementNumber || id}`
          );
          console.log('✅ Asset status updated to DISPONIBLE successfully');
        } catch (assetError) {
          console.error('❌ Error updating asset status:', assetError);
          console.warn('⚠️ Movement was rejected but asset status could not be updated');
        }
      }
      
      loadMovements();
    } catch (error) {
      throw error;
    }
  };

  const handleMarkInProcess = async (id, executingUser) => {
    try {
      await markInProcess(id, executingUser);
      loadMovements();
    } catch (error) {
      throw error;
    }
  };

  const handleComplete = async (id) => {
    try {
      // Obtener el movimiento antes de completarlo para tener el assetId
      const movement = await assetMovementService.getMovementById(id, municipalityId);
      const assetId = movement?.assetId;
      
      await completeMovement(id);
      
      // Si el movimiento tenía un bien asociado, liberarlo (cambiar a DISPONIBLE)
      if (assetId) {
        try {
          console.log('🔄 Liberating asset (completing movement) - updating to DISPONIBLE for asset:', assetId);
          await cambiarEstadoBien(
            assetId,
            'DISPONIBLE',
            `Movimiento completado: ${movement?.movementNumber || id}`
          );
          console.log('✅ Asset status updated to DISPONIBLE successfully');
        } catch (assetError) {
          console.error('❌ Error updating asset status:', assetError);
          console.warn('⚠️ Movement was completed but asset status could not be updated');
        }
      }
      
      loadMovements();
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = async (id, cancellationReason) => {
    try {
      // Obtener el movimiento antes de cancelarlo para tener el assetId
      const movement = await assetMovementService.getMovementById(id, municipalityId);
      const assetId = movement?.assetId;
      
      await cancelMovement(id, cancellationReason);
      
      // Si el movimiento tenía un bien asociado, liberarlo (cambiar a DISPONIBLE)
      if (assetId) {
        try {
          console.log('🔄 Liberating asset (cancelling movement) - updating to DISPONIBLE for asset:', assetId);
          await cambiarEstadoBien(
            assetId,
            'DISPONIBLE',
            `Movimiento cancelado: ${movement?.movementNumber || id}${cancellationReason ? ` - ${cancellationReason}` : ''}`
          );
          console.log('✅ Asset status updated to DISPONIBLE successfully');
        } catch (assetError) {
          console.error('❌ Error updating asset status:', assetError);
          console.warn('⚠️ Movement was cancelled but asset status could not be updated');
        }
      }
      
      loadMovements();
    } catch (error) {
      throw error;
    }
  };

  const handleRestore = async (movement) => {
    if (!movement || !movement.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede restaurar: ID de movimiento no válido',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Restaurar movimiento?',
      html: `
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p class="text-slate-600">Esta acción restaurará el movimiento y volverá a estar activo en el sistema.</p>
          <p class="text-sm text-slate-500 mt-2">Movimiento: <strong>${movement.movementNumber || movement.id.slice(-8)}</strong></p>
        </div>
      `,
      icon: null,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      background: '#ffffff',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200',
        title: 'text-2xl font-bold text-slate-900 mb-4',
        htmlContainer: 'text-slate-600',
        confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
        cancelButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
      },
    });

    if (result.isConfirmed) {
      try {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const restoredBy = currentUser?.userId || currentUser?.id || 'system';

        if (!restoredBy || restoredBy === 'system') {
          console.warn('⚠️ No se pudo obtener el ID del usuario actual, usando "system"');
        }

        // Mostrar loading
        Swal.fire({
          title: 'Restaurando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Llamar al servicio de restauración
        await restoreMovement(movement.id, restoredBy);

        // Mostrar éxito
        Swal.fire({
          title: '¡Restaurado!',
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-slate-600">El movimiento fue restaurado correctamente y ahora está activo.</p>
            </div>
          `,
          icon: null,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-2xl shadow-2xl border border-slate-200',
            title: 'text-2xl font-bold text-slate-900 mb-4',
            htmlContainer: 'text-slate-600',
            confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
          },
        });

        // Recargar la lista de movimientos activos
        await loadMovements();
        
        // Si el filtro está en "inactive" o "all", también recargar los eliminados
        if (activeFilter === 'inactive' || activeFilter === 'all') {
          try {
            const deleted = await assetMovementService.getDeletedMovements(municipalityId);
            setDeletedMovements(Array.isArray(deleted) ? deleted : []);
          } catch (err) {
            console.error('❌ Error reloading deleted movements:', err);
          }
        }
      } catch (err) {
        Swal.fire({
          title: 'Error al restaurar',
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-slate-600">${err.message || 'No se pudo restaurar el movimiento'}</p>
            </div>
          `,
          icon: null,
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Cerrar',
          customClass: {
            popup: 'rounded-2xl shadow-2xl border border-slate-200',
            title: 'text-2xl font-bold text-slate-900 mb-4',
            htmlContainer: 'text-slate-600',
            confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
          },
        });
        console.error(err);
      }
    }
  };

  const handleDelete = async (movement) => {
    if (!movement || !movement.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede eliminar: ID de movimiento no válido',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar movimiento?',
      html: `
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p class="text-slate-600">Esta acción marcará el movimiento como eliminado.<br/>Podrás restaurarlo después si es necesario.</p>
          <p class="text-sm text-slate-500 mt-2">Movimiento: <strong>${movement.movementNumber || movement.id.slice(-8)}</strong></p>
        </div>
      `,
      icon: null,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      background: '#ffffff',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200',
        title: 'text-2xl font-bold text-slate-900 mb-4',
        htmlContainer: 'text-slate-600',
        confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
        cancelButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
      },
    });

    if (result.isConfirmed) {
      try {
        // Obtener el usuario actual del localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const deletedBy = currentUser?.userId || currentUser?.id || 'system';

        if (!deletedBy || deletedBy === 'system') {
          console.warn('⚠️ No se pudo obtener el ID del usuario actual, usando "system"');
        }

        // Mostrar loading
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Llamar al servicio de eliminación
        await deleteMovement(movement.id, deletedBy);

        // Mostrar éxito
        Swal.fire({
          title: '¡Eliminado!',
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-slate-600">El movimiento fue marcado como eliminado correctamente.</p>
            </div>
          `,
          icon: null,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-2xl shadow-2xl border border-slate-200',
            title: 'text-2xl font-bold text-slate-900 mb-4',
            htmlContainer: 'text-slate-600',
            confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
          },
        });

        // Recargar la lista de movimientos activos
        await loadMovements();
        
        // Si el filtro está en "inactive" o "all", también recargar los eliminados
        if (activeFilter === 'inactive' || activeFilter === 'all') {
          try {
            const deleted = await assetMovementService.getDeletedMovements(municipalityId);
            setDeletedMovements(Array.isArray(deleted) ? deleted : []);
          } catch (err) {
            console.error('❌ Error reloading deleted movements:', err);
          }
        }
      } catch (err) {
        Swal.fire({
          title: 'Error al eliminar',
          html: `
            <div class="text-center">
              <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-slate-600">${err.message || 'No se pudo eliminar el movimiento'}</p>
            </div>
          `,
          icon: null,
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'Cerrar',
          customClass: {
            popup: 'rounded-2xl shadow-2xl border border-slate-200',
            title: 'text-2xl font-bold text-slate-900 mb-4',
            htmlContainer: 'text-slate-600',
            confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-sm',
          },
        });
        console.error(err);
      }
    }
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: MovementStatus.REQUESTED, label: 'Solicitado' },
    { value: MovementStatus.APPROVED, label: 'Aprobado' },
    { value: MovementStatus.REJECTED, label: 'Rechazado' },
    { value: MovementStatus.IN_PROCESS, label: 'En Proceso' },
    { value: MovementStatus.COMPLETED, label: 'Completado' },
    { value: MovementStatus.CANCELLED, label: 'Cancelado' },
    { value: MovementStatus.PARTIAL, label: 'Parcial' }
  ];

  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: MovementType.INITIAL_ASSIGNMENT, label: 'Primera Asignación' },
    { value: MovementType.REASSIGNMENT, label: 'Reasignación' },
    { value: MovementType.AREA_TRANSFER, label: 'Transferencia entre Áreas' },
    { value: MovementType.EXTERNAL_TRANSFER, label: 'Transferencia Externa' },
    { value: MovementType.RETURN, label: 'Devolución' },
    { value: MovementType.LOAN, label: 'Préstamo Temporal' },
    { value: MovementType.MAINTENANCE, label: 'Mantenimiento' },
    { value: MovementType.REPAIR, label: 'Reparación' },
    { value: MovementType.TEMPORARY_DISPOSAL, label: 'Baja Temporal' }
  ];

  // Cargar movimientos eliminados cuando sea necesario
  useEffect(() => {
    const loadDeletedMovements = async () => {
      if (activeFilter === 'inactive' || activeFilter === 'all') {
        try {
          setLoadingDeleted(true);
          console.log('🔄 Loading deleted movements...');
          const deleted = await assetMovementService.getDeletedMovements(municipalityId);
          console.log('📊 Deleted movements loaded:', deleted.length, 'items');
          setDeletedMovements(Array.isArray(deleted) ? deleted : []);
        } catch (err) {
          console.error('❌ Error loading deleted movements:', err);
          setDeletedMovements([]);
        } finally {
          setLoadingDeleted(false);
        }
      } else {
        setDeletedMovements([]);
      }
    };

    loadDeletedMovements();
  }, [municipalityId, activeFilter]);

  // Función para determinar si un movimiento está activo
  const isMovementActive = (movement) => {
    // Si tiene campo active, debe ser true
    if (movement.active !== undefined) {
      return movement.active === true;
    }
    // Si tiene campo deleted, debe ser false
    if (movement.deleted !== undefined) {
      return movement.deleted === false;
    }
    // Si tiene deletedAt, está inactivo
    if (movement.deletedAt) {
      return false;
    }
    // Por defecto, considerar activo
    return true;
  };

  // Combinar movimientos activos y eliminados según el filtro
  const allMovementsToFilter = activeFilter === 'all' 
    ? [...movements, ...deletedMovements]
    : activeFilter === 'inactive'
    ? deletedMovements
    : movements; // activeFilter === 'active'

  // Filtrar movimientos según los filtros aplicados
  const filteredMovements = allMovementsToFilter.filter(movement => {
    // Filtro por estado
    if (statusFilter && movement.movementStatus !== statusFilter) {
      return false;
    }
    
    // Filtro por tipo
    if (typeFilter && movement.movementType !== typeFilter) {
      return false;
    }
    
    // Filtro por activo/inactivo
    const isActive = isMovementActive(movement);
    if (activeFilter === 'active' && !isActive) {
      return false;
    }
    if (activeFilter === 'inactive' && isActive) {
      return false;
    }
    // Si activeFilter === 'all', no filtrar por este criterio
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Color Personalizado */}
      <div className="shadow-lg mb-8 rounded-2xl" style={{ backgroundColor: '#283447' }}>
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Movimientos de Activos
                </h1>
                <p className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Gestión y seguimiento de movimientos patrimoniales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Movimiento
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Estadísticas Profesionales */}
        {movements.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total de Movimientos */}
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderLeft: '4px solid #283447' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Movimientos</p>
                    <p className="text-3xl font-bold text-slate-800">{movements.filter(m => isMovementActive(m)).length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(40, 52, 71, 0.1)', color: '#283447' }}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Movimientos Solicitados */}
              <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Solicitados</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {movements.filter((m) => isMovementActive(m) && m.movementStatus === MovementStatus.REQUESTED).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Movimientos En Proceso */}
              <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Proceso</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {movements.filter((m) => isMovementActive(m) && m.movementStatus === MovementStatus.IN_PROCESS).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Movimientos Completados */}
              <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Completados</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {movements.filter((m) => isMovementActive(m) && m.movementStatus === MovementStatus.COMPLETED).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro por Estado */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                Estado
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer transition-all text-sm"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(40, 52, 71, 0.2)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                Tipo
              </label>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer transition-all text-sm"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(40, 52, 71, 0.2)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filtro por Activo/Inactivo */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                Estado del Registro
              </label>
              <div className="relative">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer transition-all text-sm"
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(40, 52, 71, 0.2)'}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                >
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="all">Todos</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Estado de Loading Global */}
      {(loading || loadingDeleted) && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Cargando movimientos...</p>
          </div>
        </div>
      )}

      {/* Error Global */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadMovements}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Movimientos */}
      <MovementsList
        municipalityId={municipalityId}
        statusFilter={statusFilter || null}
        typeFilter={typeFilter || null}
        activeFilter={activeFilter}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        movements={filteredMovements}
        loading={loading}
        error={error}
      />

      {/* Formulario Modal */}
      {showForm && (
        <MovementForm
          municipalityId={municipalityId}
          movement={selectedMovement}
          assets={assets}
          users={users}
          persons={persons}
          areas={areas}
          locations={locations}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          loadingData={loadingData}
        />
      )}

      {/* Detalles Modal */}
      {showDetails && selectedMovement && (
        <MovementDetails
          movementId={selectedMovement.id}
          municipalityId={municipalityId}
          onClose={handleDetailsClose}
          onEdit={handleEdit}
          onApprove={handleApprove}
          onReject={handleReject}
          onMarkInProcess={handleMarkInProcess}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

