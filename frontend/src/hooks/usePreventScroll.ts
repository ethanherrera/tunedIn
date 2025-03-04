import { useEffect } from 'react';

/**
 * Hook to prevent scrolling on the body when a modal or overlay is active
 * @param isActive Boolean indicating whether the modal/overlay is active
 */
const usePreventScroll = (isActive: boolean): void => {
  useEffect(() => {
    if (isActive) {
      // Store the original overflow and padding values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Get the width of the scrollbar to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply styles to prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Add padding equal to scrollbar width to prevent layout shift
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      // Cleanup function to restore original styles
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isActive]);
};

export default usePreventScroll; 