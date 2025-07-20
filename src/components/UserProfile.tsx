import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, Bookmark, FileText, BarChart3, X } from 'lucide-react';
import { supabase, databaseService } from '../services/database';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'alerts' | 'bookmarks' | 'analytics'>('profile');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      loadUserData(user.id);
    }
  };

  const loadUserData = async (userId: string) => {
    setLoading(true);
    try {
      const [alertsData, bookmarksData] = await Promise.all([
        databaseService.getUserAlerts(userId),
        databaseService.getUserBookmarks(userId)
      ]);
      
      setAlerts(alertsData);
      setBookmarks(bookmarksData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'demo123'
    });
    
    if (error) {
      console.error('Error signing in:', error);
    } else {
      checkUser();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAlerts([]);
    setBookmarks([]);
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Iniciar Sesión</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-4">
            Inicia sesión para acceder a funciones avanzadas como alertas, bookmarks y analytics.
          </p>
          
          <button
            onClick={signIn}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Demo Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Panel de Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-96">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-6">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-gray-500">Usuario Demo</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span>Perfil</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('alerts')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'alerts' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  <span>Alertas ({alerts.length})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'bookmarks' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Bookmark className="h-5 w-5" />
                  <span>Guardados ({bookmarks.length})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left ${
                    activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics</span>
                </button>
              </nav>
              
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={signOut}
                  className="w-full text-red-600 hover:text-red-700 text-sm"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Configuración del Perfil</h3>
                  <p className="text-gray-600">
                    Configuración de perfil y preferencias de usuario.
                  </p>
                </div>
              )}
              
              {activeTab === 'alerts' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Alertas de Email</h3>
                  <p className="text-gray-600 mb-4">
                    Configura alertas para recibir notificaciones de nuevas oportunidades.
                  </p>
                  {alerts.length === 0 ? (
                    <p className="text-gray-500">No tienes alertas configuradas.</p>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map(alert => (
                        <div key={alert.id} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{alert.name}</h4>
                          <p className="text-sm text-gray-600">
                            Frecuencia: {alert.email_frequency}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'bookmarks' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Oportunidades Guardadas</h3>
                  {bookmarks.length === 0 ? (
                    <p className="text-gray-500">No tienes oportunidades guardadas.</p>
                  ) : (
                    <div className="space-y-3">
                      {bookmarks.map(bookmark => (
                        <div key={bookmark.id} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{bookmark.procurement_releases?.title || 'Sin título'}</h4>
                          <p className="text-sm text-gray-600">
                            {bookmark.procurement_releases?.buyer_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'analytics' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Analytics y Tendencias</h3>
                  <p className="text-gray-600">
                    Análisis de tendencias de precios y rendimiento de proveedores.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};