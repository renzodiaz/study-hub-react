import { useContext } from 'react';
import { DrawerContext } from '@contexts/drawerContext';

export const useDrawer = () => useContext(DrawerContext);
