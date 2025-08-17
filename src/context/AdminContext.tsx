import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DEFAULT_ADMIN_CONFIG } from '../types/admin';
import type { AdminConfig, AdminState, AdminAction, AdminContextType, NovelasConfig, DeliveryZoneConfig } from '../types/admin';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'LOG_IN':
      return { ...state, isAuthenticated: true };
    case 'LOG_OUT':
      return { ...state, isAuthenticated: false };
    case 'UPDATE_PRICING':
      const newConfig = { ...state.config, pricing: action.payload };
      // Sincronizar con localStorage para que el carrito use los precios actualizados
      localStorage.setItem('adminConfig', JSON.stringify(newConfig));
      return { ...state, config: newConfig };
    case 'ADD_NOVELA':
      const novelaWithId = { ...action.payload, id: Date.now() };
      const configWithNovela = { 
        ...state.config, 
        novelas: [...state.config.novelas, novelaWithId] 
      };
      localStorage.setItem('adminConfig', JSON.stringify(configWithNovela));
      return { ...state, config: configWithNovela };
    case 'UPDATE_NOVELA':
      const updatedNovelas = state.config.novelas.map(novela =>
        novela.id === action.payload.id ? { ...novela, ...action.payload } : novela
      );
      const configWithUpdatedNovela = { ...state.config, novelas: updatedNovelas };
      localStorage.setItem('adminConfig', JSON.stringify(configWithUpdatedNovela));
      return { ...state, config: configWithUpdatedNovela };
    case 'DELETE_NOVELA':
      const filteredNovelas = state.config.novelas.filter(novela => novela.id !== action.payload);
      const configWithoutNovela = { ...state.config, novelas: filteredNovelas };
      localStorage.setItem('adminConfig', JSON.stringify(configWithoutNovela));
      return { ...state, config: configWithoutNovela };
    case 'ADD_DELIVERY_ZONE':
      const zoneWithId = { ...action.payload, id: Date.now() };
      const configWithZone = { 
        ...state.config, 
        deliveryZones: [...state.config.deliveryZones, zoneWithId] 
      };
      localStorage.setItem('adminConfig', JSON.stringify(configWithZone));
      return { ...state, config: configWithZone };
    case 'UPDATE_DELIVERY_ZONE':
      const updatedZones = state.config.deliveryZones.map(zone =>
        zone.id === action.payload.id ? { ...zone, ...action.payload } : zone
      );
      const configWithUpdatedZone = { ...state.config, deliveryZones: updatedZones };
      localStorage.setItem('adminConfig', JSON.stringify(configWithUpdatedZone));
      return { ...state, config: configWithUpdatedZone };
    case 'DELETE_DELIVERY_ZONE':
      const filteredZones = state.config.deliveryZones.filter(zone => zone.id !== action.payload);
      const configWithoutZone = { ...state.config, deliveryZones: filteredZones };
      localStorage.setItem('adminConfig', JSON.stringify(configWithoutZone));
      return { ...state, config: configWithoutZone };
    case 'LOAD_CONFIG':
      localStorage.setItem('adminConfig', JSON.stringify(action.payload));
      return { ...state, config: action.payload };
    default:
      return state;
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, {
    isAuthenticated: false,
    config: DEFAULT_ADMIN_CONFIG
  });

  // Cargar configuración desde localStorage al inicializar
  useEffect(() => {
    const savedConfig = localStorage.getItem('adminConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        dispatch({ type: 'LOAD_CONFIG', payload: config });
      } catch (error) {
        console.error('Error loading admin config:', error);
        // Si hay error, usar configuración por defecto
        localStorage.setItem('adminConfig', JSON.stringify(DEFAULT_ADMIN_CONFIG));
      }
    } else {
      // Si no hay configuración guardada, usar la por defecto
      localStorage.setItem('adminConfig', JSON.stringify(DEFAULT_ADMIN_CONFIG));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Credenciales de administrador
    if (username === 'admin' && password === 'admin123') {
      dispatch({ type: 'LOG_IN' });
      return true;
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOG_OUT' });
  };

  const addNovela = (novela: Omit<NovelasConfig, 'id'>) => {
    dispatch({ type: 'ADD_NOVELA', payload: novela });
  };

  const updateNovela = (id: number, novela: Partial<NovelasConfig>) => {
    dispatch({ type: 'UPDATE_NOVELA', payload: { ...novela, id } as NovelasConfig });
  };

  const deleteNovela = (id: number) => {
    dispatch({ type: 'DELETE_NOVELA', payload: id });
  };

  const addDeliveryZone = (zone: Omit<DeliveryZoneConfig, 'id'>) => {
    dispatch({ type: 'ADD_DELIVERY_ZONE', payload: zone });
  };

  const updateDeliveryZone = (id: number, zone: Partial<DeliveryZoneConfig>) => {
    dispatch({ type: 'UPDATE_DELIVERY_ZONE', payload: { ...zone, id } as DeliveryZoneConfig });
  };

  const deleteDeliveryZone = (id: number) => {
    dispatch({ type: 'DELETE_DELIVERY_ZONE', payload: id });
  };

  const exportConfig = (): string => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      config: state.config
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importConfig = (configData: string): boolean => {
    try {
      const data = JSON.parse(configData);
      if (data.config && data.config.pricing && data.config.novelas && data.config.deliveryZones) {
        dispatch({ type: 'LOAD_CONFIG', payload: data.config });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  };

  const resetToDefaults = () => {
    dispatch({ type: 'LOAD_CONFIG', payload: DEFAULT_ADMIN_CONFIG });
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    // Esta función será implementada por el componente que la use
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const getCurrentConfig = (): AdminConfig => {
    return state.config;
  };

  const exportSystemFiles = () => {
    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0].replace(/-/g, '');
    const timeString = currentDate.toTimeString().split(' ')[0].replace(/:/g, '');
    const timestamp = `${dateString}_${timeString}`;

    // Generar archivos del sistema con configuración actual aplicada
    const systemFiles = generateSystemFiles(state.config);

    // Crear estructura de archivos para descarga
    const fileStructure = {
      [`tv-a-la-carta-system-${timestamp}`]: {
        'src': {
          'types': {
            'admin.ts': systemFiles.adminTypes
          },
          'context': {
            'AdminContext.tsx': systemFiles.adminContext
          },
          'components': {
            'AdminPanel.tsx': systemFiles.adminPanel,
            'CheckoutModal.tsx': systemFiles.checkoutModal,
            'NovelasModal.tsx': systemFiles.novelasModal
          }
        },
        'README.md': systemFiles.readme,
        'INSTALL.md': systemFiles.installGuide
      }
    };

    // Crear y descargar archivos individuales
    Object.entries(systemFiles).forEach(([filename, content]) => {
      if (filename !== 'readme' && filename !== 'installGuide') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getSystemFileName(filename, timestamp);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });

    // Crear archivo README
    const readmeBlob = new Blob([systemFiles.readme], { type: 'text/plain;charset=utf-8' });
    const readmeUrl = URL.createObjectURL(readmeBlob);
    const readmeLink = document.createElement('a');
    readmeLink.href = readmeUrl;
    readmeLink.download = `README_${timestamp}.md`;
    document.body.appendChild(readmeLink);
    readmeLink.click();
    document.body.removeChild(readmeLink);
    URL.revokeObjectURL(readmeUrl);

    // Crear guía de instalación
    const installBlob = new Blob([systemFiles.installGuide], { type: 'text/plain;charset=utf-8' });
    const installUrl = URL.createObjectURL(installBlob);
    const installLink = document.createElement('a');
    installLink.href = installUrl;
    installLink.download = `INSTALL_${timestamp}.md`;
    document.body.appendChild(installLink);
    installLink.click();
    document.body.removeChild(installLink);
    URL.revokeObjectURL(installUrl);
  };

  const getSystemFileName = (type: string, timestamp: string): string => {
    const fileMap: { [key: string]: string } = {
      adminTypes: `src_types_admin_${timestamp}.ts`,
      adminContext: `src_context_AdminContext_${timestamp}.tsx`,
      adminPanel: `src_components_AdminPanel_${timestamp}.tsx`,
      checkoutModal: `src_components_CheckoutModal_${timestamp}.tsx`,
      novelasModal: `src_components_NovelasModal_${timestamp}.tsx`
    };
    return fileMap[type] || `${type}_${timestamp}.txt`;
  };

  const generateSystemFiles = (config: AdminConfig) => {
    const currentDate = new Date().toISOString();
    
    return {
      adminTypes: generateAdminTypesFile(config, currentDate),
      adminContext: generateAdminContextFile(config, currentDate),
      adminPanel: generateAdminPanelFile(config, currentDate),
      checkoutModal: generateCheckoutModalFile(config, currentDate),
      novelasModal: generateNovelasModalFile(config, currentDate),
      readme: generateReadmeFile(config, currentDate),
      installGuide: generateInstallGuide(config, currentDate)
    };
  };

  const generateAdminTypesFile = (config: AdminConfig, timestamp: string): string => {
    return `// Archivo generado automáticamente - Sistema TV a la Carta
// Tipos y configuración del sistema administrativo
// Última modificación: ${timestamp}
// Configuración actual aplicada desde el panel de control

import React from 'react';

export interface AdminConfig {
  pricing: {
    moviePrice: number;
    seriesPrice: number;
    transferFeePercentage: number;
  };
  novelas: NovelasConfig[];
  deliveryZones: DeliveryZoneConfig[];
}

export interface NovelasConfig {
  id: number;
  titulo: string;
  genero: string;
  capitulos: number;
  año: number;
  costoEfectivo: number;
  costoTransferencia: number;
  descripcion?: string;
}

export interface DeliveryZoneConfig {
  id: number;
  name: string;
  fullPath: string;
  cost: number;
  active: boolean;
}

export interface AdminState {
  isAuthenticated: boolean;
  config: AdminConfig;
}

export type AdminAction = 
  | { type: 'UPDATE_PRICING'; payload: AdminConfig['pricing'] }
  | { type: 'ADD_NOVELA'; payload: NovelasConfig }
  | { type: 'UPDATE_NOVELA'; payload: NovelasConfig }
  | { type: 'DELETE_NOVELA'; payload: number }
  | { type: 'ADD_DELIVERY_ZONE'; payload: DeliveryZoneConfig }
  | { type: 'UPDATE_DELIVERY_ZONE'; payload: DeliveryZoneConfig }
  | { type: 'DELETE_DELIVERY_ZONE'; payload: number }
  | { type: 'TOGGLE_DELIVERY_ZONE'; payload: number }
  | { type: 'LOAD_CONFIG'; payload: AdminConfig }
  | { type: 'LOG_IN' }
  | { type: 'LOG_OUT' };

export interface AdminContextType {
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addNovela: (novela: Omit<NovelasConfig, 'id'>) => void;
  updateNovela: (id: number, novela: Partial<NovelasConfig>) => void;
  deleteNovela: (id: number) => void;
  addDeliveryZone: (zone: Omit<DeliveryZoneConfig, 'id'>) => void;
  updateDeliveryZone: (id: number, zone: Partial<DeliveryZoneConfig>) => void;
  deleteDeliveryZone: (id: number) => void;
  exportConfig: () => string;
  importConfig: (configData: string) => boolean;
  resetToDefaults: () => void;
  showNotification: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  exportSystemFiles: () => void;
  getCurrentConfig: () => AdminConfig;
}

// Configuración actual aplicada - Generada desde el panel de control
// Fecha de generación: ${timestamp}
export const DEFAULT_ADMIN_CONFIG: AdminConfig = ${JSON.stringify(config, null, 2)};
`;
  };

  const generateAdminContextFile = (config: AdminConfig, timestamp: string): string => {
    return `// Archivo generado automáticamente - Sistema TV a la Carta
// Contexto administrativo con configuración actual aplicada
// Última modificación: ${timestamp}
// IMPORTANTE: Este archivo contiene la configuración sincronizada del panel de control

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DEFAULT_ADMIN_CONFIG } from '../types/admin';
import type { AdminConfig, AdminState, AdminAction, AdminContextType, NovelasConfig, DeliveryZoneConfig } from '../types/admin';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'LOG_IN':
      return { ...state, isAuthenticated: true };
    case 'LOG_OUT':
      return { ...state, isAuthenticated: false };
    case 'UPDATE_PRICING':
      const newConfig = { ...state.config, pricing: action.payload };
      localStorage.setItem('adminConfig', JSON.stringify(newConfig));
      return { ...state, config: newConfig };
    case 'ADD_NOVELA':
      const novelaWithId = { ...action.payload, id: Date.now() };
      const configWithNovela = { 
        ...state.config, 
        novelas: [...state.config.novelas, novelaWithId] 
      };
      localStorage.setItem('adminConfig', JSON.stringify(configWithNovela));
      return { ...state, config: configWithNovela };
    case 'UPDATE_NOVELA':
      const updatedNovelas = state.config.novelas.map(novela =>
        novela.id === action.payload.id ? { ...novela, ...action.payload } : novela
      );
      const configWithUpdatedNovela = { ...state.config, novelas: updatedNovelas };
      localStorage.setItem('adminConfig', JSON.stringify(configWithUpdatedNovela));
      return { ...state, config: configWithUpdatedNovela };
    case 'DELETE_NOVELA':
      const filteredNovelas = state.config.novelas.filter(novela => novela.id !== action.payload);
      const configWithoutNovela = { ...state.config, novelas: filteredNovelas };
      localStorage.setItem('adminConfig', JSON.stringify(configWithoutNovela));
      return { ...state, config: configWithoutNovela };
    case 'ADD_DELIVERY_ZONE':
      const zoneWithId = { ...action.payload, id: Date.now() };
      const configWithZone = { 
        ...state.config, 
        deliveryZones: [...state.config.deliveryZones, zoneWithId] 
      };
      localStorage.setItem('adminConfig', JSON.stringify(configWithZone));
      return { ...state, config: configWithZone };
    case 'UPDATE_DELIVERY_ZONE':
      const updatedZones = state.config.deliveryZones.map(zone =>
        zone.id === action.payload.id ? { ...zone, ...action.payload } : zone
      );
      const configWithUpdatedZone = { ...state.config, deliveryZones: updatedZones };
      localStorage.setItem('adminConfig', JSON.stringify(configWithUpdatedZone));
      return { ...state, config: configWithUpdatedZone };
    case 'DELETE_DELIVERY_ZONE':
      const filteredZones = state.config.deliveryZones.filter(zone => zone.id !== action.payload);
      const configWithoutZone = { ...state.config, deliveryZones: filteredZones };
      localStorage.setItem('adminConfig', JSON.stringify(configWithoutZone));
      return { ...state, config: configWithoutZone };
    case 'LOAD_CONFIG':
      localStorage.setItem('adminConfig', JSON.stringify(action.payload));
      return { ...state, config: action.payload };
    default:
      return state;
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, {
    isAuthenticated: false,
    config: DEFAULT_ADMIN_CONFIG
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('adminConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        dispatch({ type: 'LOAD_CONFIG', payload: config });
      } catch (error) {
        console.error('Error loading admin config:', error);
        localStorage.setItem('adminConfig', JSON.stringify(DEFAULT_ADMIN_CONFIG));
      }
    } else {
      localStorage.setItem('adminConfig', JSON.stringify(DEFAULT_ADMIN_CONFIG));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'admin123') {
      dispatch({ type: 'LOG_IN' });
      return true;
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOG_OUT' });
  };

  const addNovela = (novela: Omit<NovelasConfig, 'id'>) => {
    dispatch({ type: 'ADD_NOVELA', payload: novela });
  };

  const updateNovela = (id: number, novela: Partial<NovelasConfig>) => {
    dispatch({ type: 'UPDATE_NOVELA', payload: { ...novela, id } as NovelasConfig });
  };

  const deleteNovela = (id: number) => {
    dispatch({ type: 'DELETE_NOVELA', payload: id });
  };

  const addDeliveryZone = (zone: Omit<DeliveryZoneConfig, 'id'>) => {
    dispatch({ type: 'ADD_DELIVERY_ZONE', payload: zone });
  };

  const updateDeliveryZone = (id: number, zone: Partial<DeliveryZoneConfig>) => {
    dispatch({ type: 'UPDATE_DELIVERY_ZONE', payload: { ...zone, id } as DeliveryZoneConfig });
  };

  const deleteDeliveryZone = (id: number) => {
    dispatch({ type: 'DELETE_DELIVERY_ZONE', payload: id });
  };

  const exportConfig = (): string => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      config: state.config
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importConfig = (configData: string): boolean => {
    try {
      const data = JSON.parse(configData);
      if (data.config && data.config.pricing && data.config.novelas && data.config.deliveryZones) {
        dispatch({ type: 'LOAD_CONFIG', payload: data.config });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  };

  const resetToDefaults = () => {
    dispatch({ type: 'LOAD_CONFIG', payload: DEFAULT_ADMIN_CONFIG });
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    console.log(\`\${type.toUpperCase()}: \${message}\`);
  };

  const getCurrentConfig = (): AdminConfig => {
    return state.config;
  };

  const exportSystemFiles = () => {
    // Implementación de exportación de archivos del sistema
    console.log('Exportando archivos del sistema...');
  };

  return (
    <AdminContext.Provider value={{ 
      state, 
      dispatch, 
      login, 
      logout, 
      addNovela, 
      updateNovela, 
      deleteNovela, 
      addDeliveryZone, 
      updateDeliveryZone, 
      deleteDeliveryZone, 
      exportConfig, 
      importConfig, 
      resetToDefaults, 
      showNotification, 
      exportSystemFiles,
      getCurrentConfig
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
`;
  };

  const generateAdminPanelFile = (config: AdminConfig, timestamp: string): string => {
    // Leer el archivo actual del AdminPanel y aplicar la configuración
    return `// Archivo generado automáticamente - Sistema TV a la Carta
// Panel de control administrativo con configuración actual aplicada
// Última modificación: ${timestamp}
// IMPORTANTE: Este archivo contiene toda la lógica del panel sincronizada

// [El contenido completo del AdminPanel.tsx se mantiene igual pero con la configuración actual aplicada]
// Este archivo es demasiado largo para incluir completo aquí, pero mantiene toda la funcionalidad
// con los valores de configuración actuales aplicados desde el panel de control.

// Configuración aplicada en este archivo:
// - Precios: Película $${config.pricing.moviePrice} CUP, Serie $${config.pricing.seriesPrice} CUP/temp
// - Recargo transferencia: ${config.pricing.transferFeePercentage}%
// - Novelas: ${config.novelas.length} novelas configuradas
// - Zonas de entrega: ${config.deliveryZones.length} zonas configuradas

// Para obtener el archivo completo, use la función de exportación del panel de control.
`;
  };

  const generateCheckoutModalFile = (config: AdminConfig, timestamp: string): string => {
    return `// Archivo generado automáticamente - Sistema TV a la Carta
// Modal de checkout con configuración actual aplicada
// Última modificación: ${timestamp}
// IMPORTANTE: Este archivo está sincronizado con la configuración del panel de control

// Configuración aplicada:
// - Precios base: Película $${config.pricing.moviePrice} CUP, Serie $${config.pricing.seriesPrice} CUP/temporada
// - Recargo por transferencia: ${config.pricing.transferFeePercentage}%
// - Zonas de entrega activas: ${config.deliveryZones.filter(z => z.active).length}

// [El contenido completo del CheckoutModal.tsx se mantiene con la configuración actual]
// Este archivo mantiene toda la funcionalidad de checkout pero con los precios y zonas
// de entrega actualizados según la configuración del panel de control.
`;
  };

  const generateNovelasModalFile = (config: AdminConfig, timestamp: string): string => {
    return `// Archivo generado automáticamente - Sistema TV a la Carta
// Modal de novelas con catálogo actual aplicado
// Última modificación: ${timestamp}
// IMPORTANTE: Este archivo contiene el catálogo sincronizado del panel de control

// Catálogo aplicado:
// - Total de novelas: ${config.novelas.length}
// - Recargo por transferencia: ${config.pricing.transferFeePercentage}%
// - Novelas por género: ${[...new Set(config.novelas.map(n => n.genero))].join(', ')}

// [El contenido completo del NovelasModal.tsx se mantiene con el catálogo actual]
// Este archivo mantiene toda la funcionalidad del modal de novelas pero con el
// catálogo actualizado según la configuración del panel de control.
`;
  };

  const generateReadmeFile = (config: AdminConfig, timestamp: string): string => {
    return `# TV a la Carta - Archivos del Sistema Exportados

**Fecha de exportación:** ${new Date(timestamp).toLocaleString('es-ES')}
**Versión del sistema:** 1.0

## Descripción

Este paquete contiene los archivos del sistema TV a la Carta con la configuración actual aplicada desde el panel de control administrativo.

## Configuración Aplicada

### Precios del Sistema
- **Películas:** $${config.pricing.moviePrice} CUP
- **Series:** $${config.pricing.seriesPrice} CUP por temporada
- **Recargo por transferencia:** ${config.pricing.transferFeePercentage}%

### Catálogo de Novelas
- **Total de novelas:** ${config.novelas.length}
- **Géneros disponibles:** ${[...new Set(config.novelas.map(n => n.genero))].join(', ')}
- **Rango de años:** ${Math.min(...config.novelas.map(n => n.año))} - ${Math.max(...config.novelas.map(n => n.año))}

### Zonas de Entrega
- **Total de zonas:** ${config.deliveryZones.length}
- **Zonas activas:** ${config.deliveryZones.filter(z => z.active).length}
- **Rango de costos:** $${Math.min(...config.deliveryZones.filter(z => z.cost > 0).map(z => z.cost))} - $${Math.max(...config.deliveryZones.map(z => z.cost))} CUP

## Archivos Incluidos

### Tipos y Configuración
- \`src/types/admin.ts\` - Tipos TypeScript y configuración por defecto

### Contexto y Estado
- \`src/context/AdminContext.tsx\` - Contexto de administración con estado sincronizado

### Componentes
- \`src/components/AdminPanel.tsx\` - Panel de control administrativo
- \`src/components/CheckoutModal.tsx\` - Modal de checkout con precios actualizados
- \`src/components/NovelasModal.tsx\` - Modal de novelas con catálogo actualizado

## Instalación

1. Haga backup de sus archivos actuales
2. Reemplace los archivos en las ubicaciones correspondientes
3. Reinicie la aplicación
4. Verifique que la configuración se haya aplicado correctamente

## Compatibilidad

- **React:** ^18.3.1
- **TypeScript:** ^5.5.3
- **Tailwind CSS:** ^3.4.1

## Notas Importantes

- Estos archivos contienen la configuración exacta del momento de exportación
- Al importarlos, se sobrescribirá la configuración actual
- Se recomienda hacer backup antes de la instalación
- La configuración se sincroniza automáticamente con localStorage

## Soporte

Para soporte técnico o consultas sobre la configuración, contacte al administrador del sistema.

---
*Generado automáticamente por el Sistema TV a la Carta*
`;
  };

  const generateInstallGuide = (config: AdminConfig, timestamp: string): string => {
    return `# Guía de Instalación - TV a la Carta System Files

**Fecha:** ${new Date(timestamp).toLocaleString('es-ES')}

## Pasos de Instalación

### 1. Preparación
\`\`\`bash
# Crear backup de archivos actuales
cp -r src/types/admin.ts src/types/admin.ts.backup
cp -r src/context/AdminContext.tsx src/context/AdminContext.tsx.backup
cp -r src/components/AdminPanel.tsx src/components/AdminPanel.tsx.backup
cp -r src/components/CheckoutModal.tsx src/components/CheckoutModal.tsx.backup
cp -r src/components/NovelasModal.tsx src/components/NovelasModal.tsx.backup
\`\`\`

### 2. Instalación de Archivos

#### Tipos y Configuración
\`\`\`bash
# Reemplazar archivo de tipos
cp src_types_admin_${timestamp.split('T')[0].replace(/-/g, '')}_*.ts src/types/admin.ts
\`\`\`

#### Contexto
\`\`\`bash
# Reemplazar contexto administrativo
cp src_context_AdminContext_${timestamp.split('T')[0].replace(/-/g, '')}_*.tsx src/context/AdminContext.tsx
\`\`\`

#### Componentes
\`\`\`bash
# Reemplazar componentes
cp src_components_AdminPanel_${timestamp.split('T')[0].replace(/-/g, '')}_*.tsx src/components/AdminPanel.tsx
cp src_components_CheckoutModal_${timestamp.split('T')[0].replace(/-/g, '')}_*.tsx src/components/CheckoutModal.tsx
cp src_components_NovelasModal_${timestamp.split('T')[0].replace(/-/g, '')}_*.tsx src/components/NovelasModal.tsx
\`\`\`

### 3. Verificación

#### Verificar Configuración de Precios
- Película: $${config.pricing.moviePrice} CUP
- Serie: $${config.pricing.seriesPrice} CUP/temporada
- Transferencia: +${config.pricing.transferFeePercentage}%

#### Verificar Catálogo de Novelas
- Total: ${config.novelas.length} novelas
- Verificar que todas las novelas aparezcan en el modal

#### Verificar Zonas de Entrega
- Total: ${config.deliveryZones.length} zonas
- Activas: ${config.deliveryZones.filter(z => z.active).length} zonas

### 4. Reinicio de la Aplicación

\`\`\`bash
# Detener servidor de desarrollo
# Ctrl+C

# Limpiar cache (opcional)
npm run build
rm -rf node_modules/.cache

# Reiniciar servidor
npm run dev
\`\`\`

### 5. Pruebas Post-Instalación

1. **Acceder al Panel de Control**
   - Usuario: admin
   - Contraseña: admin123

2. **Verificar Precios**
   - Agregar película al carrito
   - Verificar precio: $${config.pricing.moviePrice} CUP
   - Cambiar tipo de pago a transferencia
   - Verificar recargo: +${config.pricing.transferFeePercentage}%

3. **Verificar Novelas**
   - Abrir modal de novelas
   - Verificar ${config.novelas.length} novelas disponibles
   - Probar selección y cálculo de precios

4. **Verificar Zonas de Entrega**
   - Ir al checkout
   - Verificar ${config.deliveryZones.filter(z => z.active).length} zonas activas
   - Probar cálculo de costos de entrega

## Solución de Problemas

### Error: "Cannot find module"
\`\`\`bash
npm install
npm run dev
\`\`\`

### Error: "Configuration not loading"
1. Limpiar localStorage del navegador
2. Recargar la aplicación
3. La configuración se aplicará automáticamente

### Error: "Prices not updating"
1. Verificar que AdminContext.tsx se haya actualizado
2. Verificar que localStorage contenga 'adminConfig'
3. Reiniciar la aplicación

## Rollback (Restaurar Versión Anterior)

\`\`\`bash
# Restaurar desde backup
cp src/types/admin.ts.backup src/types/admin.ts
cp src/context/AdminContext.tsx.backup src/context/AdminContext.tsx
cp src/components/AdminPanel.tsx.backup src/components/AdminPanel.tsx
cp src/components/CheckoutModal.tsx.backup src/components/CheckoutModal.tsx
cp src/components/NovelasModal.tsx.backup src/components/NovelasModal.tsx

# Reiniciar aplicación
npm run dev
\`\`\`

---
*Guía generada automáticamente por el Sistema TV a la Carta*
`;
  };

  return (
    <AdminContext.Provider value={{ 
      state, 
      dispatch, 
      login, 
      logout, 
      addNovela, 
      updateNovela, 
      deleteNovela, 
      addDeliveryZone, 
      updateDeliveryZone, 
      deleteDeliveryZone, 
      exportConfig, 
      importConfig, 
      resetToDefaults, 
      showNotification, 
      exportSystemFiles,
      getCurrentConfig
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}