import { useState } from 'react';

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Effective collapsed state considers hover expansion
  const effectiveCollapsed = isCollapsed && !isHovered;

  // Apply margin to account for sidebar width
  const marginClass = effectiveCollapsed ? 'md:ml-16' : 'md:ml-64';

  return {
    isCollapsed: effectiveCollapsed,
    toggleSidebar,
    marginClass,
    setIsHovered,
    isHovered,
  };
};