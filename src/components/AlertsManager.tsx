import React, { useState } from 'react';
import { Bell, Plus, X, Edit, Trash2 } from 'lucide-react';
import { databaseService } from '../services/database';

interface AlertsManagerProps {
  onClose: () => void;
  userId: string;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({ onClose, userId }) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    keywords: '',
    entities: '',
    regions: '',
    categories: '',
    minBudget: '',
    maxBudget: '',
    emailFrequency: 'daily'
  });

  const handleCreateAlert = async () => {
    try {
      const alertData = {
        name: newAlert.name,
        keywords: newAlert.keywords.split(',').map(k => k.trim()).filter(k => k),
        entities: newAlert.entities.split(',').map(e => e.trim()).filter(e => e),
        regions: newAlert.regions.split(',').map(r => r.trim()).filter(r => r),
        categories: newAlert.categories.split(',').map(c => c.trim()).filter(c => c),
        min_budget: newAlert.minBudget ? parseFloat(newAlert.minBudget) : null,
        max_budget: newAlert.maxBudget ? parseFloat(newAlert.maxBudget) : null,
        email_frequency: newAlert.emailFrequency,
        is_active: true
      };

      const createdAlert = await databaseService.createUserAlert(userId, alertData);
      
      if (createdAlert) {
        setAlerts([...alerts, createdAlert]);
        setShowCreateForm(false);
        setNewAlert({
          name: '',
          keywords: '',
          entities: '',
          regions: '',
          categories: '',
          minBudget: '',
          maxBudget: '',
          emailFrequency: 'daily'
        });
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Gestión de Alertas</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Configura alertas para recibir notificaciones automáticas de nuevas oportunidades.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Alerta</span>
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-4">Crear Nueva Alerta</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Alerta
                  </label>
                  <input
                    type="text"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="ej: Consultoría IT"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palabras Clave (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={newAlert.keywords}
                    onChange={(e) => setNewAlert({...newAlert, keywords: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="tecnología, software, consultoría"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entidades (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={newAlert.entities}
                    onChange={(e) => setNewAlert({...newAlert, entities: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Ministerio de Educación, DGCP"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regiones (separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={newAlert.regions}
                    onChange={(e) => setNewAlert({...newAlert, regions: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Santo Domingo, Santiago"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Presupuesto Mínimo (DOP)
                  </label>
                  <input
                    type="number"
                    value={newAlert.minBudget}
                    onChange={(e) => setNewAlert({...newAlert, minBudget: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="100000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia de Email
                  </label>
                  <select
                    value={newAlert.emailFrequency}
                    onChange={(e) => setNewAlert({...newAlert, emailFrequency: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="immediate">Inmediato</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateAlert}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Crear Alerta
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tienes alertas configuradas</p>
                <p className="text-sm">Crea una alerta para recibir notificaciones automáticas</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{alert.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Frecuencia: {alert.email_frequency}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          alert.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {alert.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {alert.keywords && alert.keywords.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Palabras clave: </span>
                      <span className="text-sm">{alert.keywords.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};