import { useState } from 'react';
import { DrawerContext } from './drawerContext';

export const DrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState('Title Panel');
  const [description, setDescription] = useState(
    'Add some description to your panel.',
  );

  const openDrawer = (content, title, description) => {
    setIsOpen(true);
    setTitle(title);
    setDescription(description);
    setContent(content);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setTitle(title);
    setDescription(description);
    setContent(null);
  };

  return (
    <DrawerContext.Provider
      value={{ title, description, isOpen, content, openDrawer, closeDrawer }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
