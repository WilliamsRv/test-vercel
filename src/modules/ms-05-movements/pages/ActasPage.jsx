import { useState, useEffect } from 'react';
import HandoverReceiptList from '../components/HandoverReceipt/HandoverReceiptList';
import HandoverReceiptForm from '../components/HandoverReceipt/HandoverReceiptForm';
import HandoverReceiptDetails from '../components/HandoverReceipt/HandoverReceiptDetails';
import HandoverReceiptSignature from '../components/HandoverReceipt/HandoverReceiptSignature';
import { useHandoverReceipts } from '../hooks/useHandoverReceipts';
import handoverUserService from '../services/handoverUserService';
import assetMovementService from '../services/assetMovementService';




export default function ActasPage() {
  const municipalityId = '24ad12a5-d9e5-4cdd-91f1-8fd0355c9473';
 
  const {
    receipts,
    loading,
    error,
    loadReceipts,
    createReceipt,
    updateReceiptData,
    signReceipt
  } = useHandoverReceipts(municipalityId);




  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [users, setUsers] = useState([]);
  const [availableMovements, setAvailableMovements] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);




  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUsers(true);
        setLoadingMovements(true);
       
        const userData = await handoverUserService.getUsersByMunicipality(municipalityId);
        setUsers(userData);
       
        const movementsData = await assetMovementService.getAllMovements(municipalityId);
        setAvailableMovements(movementsData);
       
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setUsers([]);
        setAvailableMovements([]);
      } finally {
        setLoadingUsers(false);
        setLoadingMovements(false);
      }
    };




    loadData();
  }, [municipalityId]);




  const handleCreateNew = async () => {
    setSelectedReceipt(null);
    try {
      setLoadingMovements(true);
      const movementsData = await assetMovementService.getAllMovements(municipalityId);
      setAvailableMovements(movementsData);
      setLoadingMovements(false);
    } catch (error) {
      console.error('Error reloading movements:', error);
      setLoadingMovements(false);
    }
    setShowForm(true);
  };




  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setShowForm(true);
  };




  const handleView = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDetails(true);
  };




  const handleSign = (receipt) => {
    setSelectedReceipt(receipt);
    setShowSignature(true);
  };




  const handleFormSave = async (receiptData) => {
    try {
      if (selectedReceipt) {
        await updateReceiptData(selectedReceipt.id, receiptData);
      } else {
        await createReceipt(receiptData);
      }
      setShowForm(false);
      setSelectedReceipt(null);
      await loadReceipts();
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  };




  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedReceipt(null);
  };




  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedReceipt(null);
  };




  const handleSignatureComplete = async (signatureData) => {
    try {
      await signReceipt(selectedReceipt.id, signatureData);
    } catch (error) {
      console.error('Error signing receipt:', error);
    } finally {
      setShowSignature(false);
      setSelectedReceipt(null);
      await loadReceipts();
    }
  };




  const handleSignatureCancel = () => {
    setShowSignature(false);
    setSelectedReceipt(null);
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header - Azul */}
      <div className="bg-blue-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Actas de Entrega-Recepción
                </h1>
                <p className="text-blue-100 text-sm font-medium">
                  Gestión de actas de entrega-recepción de bienes patrimoniales
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              disabled={loadingMovements || loadingUsers}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm ${
                loadingMovements || loadingUsers
                  ? 'bg-white/30 text-white/70 cursor-not-allowed'
                  : 'bg-transparent border-2 border-white/70 hover:bg-white/20 text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {loadingMovements || loadingUsers ? 'Cargando...' : 'Nueva Acta'}
            </button>
          </div>
        </div>
      </div>




      {/* Estadísticas */}
      {receipts.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Actas</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>




            <div className="bg-white border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Firmadas</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.filter(r => r.receiptStatus === 'FULLY_SIGNED').length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>




            <div className="bg-white border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pendientes</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.filter(r => r.receiptStatus === 'GENERATED' || r.receiptStatus === 'PARTIALLY_SIGNED').length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>




            <div className="bg-white border-l-4 border-l-red-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Anuladas</p>
                  <p className="text-3xl font-bold text-slate-800">{receipts.filter(r => r.receiptStatus === 'VOIDED').length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}




      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
          <button onClick={loadReceipts} className="mt-2 text-sm underline hover:text-red-900">
            Intentar nuevamente
          </button>
        </div>
      )}




      {/* Lista de Actas */}
      <HandoverReceiptList
        receipts={receipts}
        users={users}
        loading={false}
        error={null}
        onView={handleView}
        onEdit={handleEdit}
        onSign={handleSign}
        onRetry={loadReceipts}
      />




      {/* Formulario Modal */}
      {showForm && (
        <HandoverReceiptForm
          municipalityId={municipalityId}
          receipt={selectedReceipt}
          movements={availableMovements}
          users={users}
          loadingMovements={loadingMovements}
          loadingUsers={loadingUsers}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}




      {/* Detalles Modal */}
      {showDetails && selectedReceipt && (
        <HandoverReceiptDetails
          receiptId={selectedReceipt.id}
          municipalityId={municipalityId}
          users={users}
          movements={availableMovements}
          onClose={handleDetailsClose}
          onEdit={handleEdit}
          onSign={handleSign}
        />
      )}




      {/* Firma Modal */}
      {showSignature && selectedReceipt && (
        <HandoverReceiptSignature
          receipt={selectedReceipt}
          municipalityId={municipalityId}
          onSigned={handleSignatureComplete}
          onCancel={handleSignatureCancel}
        />
      )}
    </div>
  );
}









