import { useState } from 'react';
import { DrawerContext } from './drawerContext';

export const DrawerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState(null);
  const [description, setDescription] = useState(null);
  const [formId, setFormId] = useState(null);
  const [isPending, setIsPending] = useState(false);

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
    setIsPending(false);
  };

  return (
    <DrawerContext.Provider
      value={{
        title,
        description,
        formId,
        isOpen,
        isPending,
        content,
        openDrawer,
        closeDrawer,
        setIsPending,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
