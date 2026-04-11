import { useState } from 'react';
import { DrawerContext } from './drawerContext';

export const DrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState('Title Panel');
  const [description, setDescription] = useState(
    'Add some description to your panel.',
  );
  const [formId, setFormId] = useState(null);

  const openDrawer = (content, title, description, formId) => {
    setIsOpen(true);
    setTitle(title);
    setDescription(description);
    setContent(content);
    setFormId(formId);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setTitle(null);
    setDescription(null);
    setContent(null);
    setFormId(null);
  };

  return (
    <DrawerContext.Provider
      value={{
        title,
        description,
        formId,
        isOpen,
        content,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
