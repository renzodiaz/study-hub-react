'use client';

import SidebarNav from './SidebarNav';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react';

import { XMarkIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-20 lg:hidden"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <div className="relative flex h-16 shrink-0 items-center">
                <img
                  alt="Your Company"
                  src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                  className="h-8 w-auto"
                />
              </div>
              <nav className="relative flex flex-1 flex-col">
                <SidebarNav onLinkClick={closeSidebar} />
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-72 lg:flex-col">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <img
              alt="Your Company"
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
              className="h-8 w-auto"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <SidebarNav />
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
