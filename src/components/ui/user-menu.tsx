"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, User, LogOut } from "lucide-react";

interface UserMenuProps {
  user?: { name: string; avatar?: string };
  onSignOut?: () => void;
}

// ✅ Ensure correct export (Named export)
export function UserMenu({ user, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
        ) : (
          <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden"
          >
            <ul className="py-2">
              {user ? (
                <>
                  <li className="px-4 py-2 text-gray-700 dark:text-gray-200">
                    <strong>{user.name}</strong>
                  </li>
                  <li>
                    <button
                      onClick={onSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Menu className="w-4 h-4" /> Sign In
                  </button>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
