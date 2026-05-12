import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  maxWidth?: string;
  className?: string;
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'auto',
  maxWidth,
  className = '',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [dynamicStyles, setDynamicStyles] = useState<React.CSSProperties>({});
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Smart max-width calculation based on content length and screen size
  const getSmartMaxWidth = () => {
    if (maxWidth) return maxWidth;
    
    const contentLength = content.length;
    const viewportWidth = window.innerWidth;
    
    // Responsive max-width based on viewport and content
    if (viewportWidth < 480) { // mobile
      return Math.min(viewportWidth - 32, contentLength < 50 ? 150 : contentLength < 100 ? 200 : 250);
    } else if (viewportWidth < 768) { // tablet
      return Math.min(viewportWidth - 64, contentLength < 50 ? 180 : contentLength < 100 ? 240 : 300);
    } else { // desktop
      return contentLength < 50 ? 200 : contentLength < 100 ? 280 : contentLength < 200 ? 350 : 400;
    }
  };

  const calculateOptimalPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipElement = tooltipRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Temporarily show tooltip to measure its dimensions
    tooltipElement.style.visibility = 'hidden';
    tooltipElement.style.display = 'block';
    const tooltipRect = tooltipElement.getBoundingClientRect();
    tooltipElement.style.visibility = '';
    tooltipElement.style.display = '';

    const margin = 8; // Space between tooltip and trigger
    const viewportMargin = 16; // Minimum space from viewport edge

    // Available space in each direction
    const spaces = {
      top: triggerRect.top - viewportMargin,
      bottom: viewportHeight - triggerRect.bottom - viewportMargin,
      left: triggerRect.left - viewportMargin,
      right: viewportWidth - triggerRect.right - viewportMargin
    };

    let bestPosition = position === 'auto' ? 'bottom' : position;
    let styles: React.CSSProperties = {};

    // Auto-position logic
    if (position === 'auto') {
      if (spaces.bottom >= tooltipRect.height + margin) {
        bestPosition = 'bottom';
      } else if (spaces.top >= tooltipRect.height + margin) {
        bestPosition = 'top';
      } else if (spaces.right >= tooltipRect.width + margin) {
        bestPosition = 'right';
      } else if (spaces.left >= tooltipRect.width + margin) {
        bestPosition = 'left';
      } else {
        // Use the position with the most space
        bestPosition = Object.entries(spaces).reduce((a, b) => spaces[a[0]] > spaces[b[0]] ? a : b)[0] as any;
      }
    }

    // Calculate position and handle viewport boundaries
    switch (bestPosition) {
      case 'top':
        styles.bottom = '100%';
        styles.marginBottom = `${margin}px`;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        
        // Adjust horizontal position if tooltip would overflow
        const leftOverflow = (triggerRect.left + triggerRect.width / 2) - (tooltipRect.width / 2);
        const rightOverflow = (triggerRect.left + triggerRect.width / 2) + (tooltipRect.width / 2) - viewportWidth;
        
        if (leftOverflow < viewportMargin) {
          styles.left = '0';
          styles.transform = 'none';
          styles.marginLeft = `${viewportMargin - triggerRect.left}px`;
        } else if (rightOverflow > -viewportMargin) {
          styles.left = 'auto';
          styles.right = '0';
          styles.transform = 'none';
          styles.marginRight = `${(triggerRect.right - viewportWidth) + viewportMargin}px`;
        }
        break;

      case 'bottom':
        styles.top = '100%';
        styles.marginTop = `${margin}px`;
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        
        // Adjust horizontal position if tooltip would overflow
        const leftOverflowBottom = (triggerRect.left + triggerRect.width / 2) - (tooltipRect.width / 2);
        const rightOverflowBottom = (triggerRect.left + triggerRect.width / 2) + (tooltipRect.width / 2) - viewportWidth;
        
        if (leftOverflowBottom < viewportMargin) {
          styles.left = '0';
          styles.transform = 'none';
          styles.marginLeft = `${viewportMargin - triggerRect.left}px`;
        } else if (rightOverflowBottom > -viewportMargin) {
          styles.left = 'auto';
          styles.right = '0';
          styles.transform = 'none';
          styles.marginRight = `${(triggerRect.right - viewportWidth) + viewportMargin}px`;
        }
        break;

      case 'left':
        styles.right = '100%';
        styles.marginRight = `${margin}px`;
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        
        // Adjust vertical position if tooltip would overflow
        const topOverflow = (triggerRect.top + triggerRect.height / 2) - (tooltipRect.height / 2);
        const bottomOverflow = (triggerRect.top + triggerRect.height / 2) + (tooltipRect.height / 2) - viewportHeight;
        
        if (topOverflow < viewportMargin) {
          styles.top = '0';
          styles.transform = 'none';
          styles.marginTop = `${viewportMargin - triggerRect.top}px`;
        } else if (bottomOverflow > -viewportMargin) {
          styles.top = 'auto';
          styles.bottom = '0';
          styles.transform = 'none';
          styles.marginBottom = `${(triggerRect.bottom - viewportHeight) + viewportMargin}px`;
        }
        break;

      case 'right':
        styles.left = '100%';
        styles.marginLeft = `${margin}px`;
        styles.top = '50%';
        styles.transform = 'translateY(-50%)';
        
        // Adjust vertical position if tooltip would overflow
        const topOverflowRight = (triggerRect.top + triggerRect.height / 2) - (tooltipRect.height / 2);
        const bottomOverflowRight = (triggerRect.top + triggerRect.height / 2) + (tooltipRect.height / 2) - viewportHeight;
        
        if (topOverflowRight < viewportMargin) {
          styles.top = '0';
          styles.transform = 'none';
          styles.marginTop = `${viewportMargin - triggerRect.top}px`;
        } else if (bottomOverflowRight > -viewportMargin) {
          styles.top = 'auto';
          styles.bottom = '0';
          styles.transform = 'none';
          styles.marginBottom = `${(triggerRect.bottom - viewportHeight) + viewportMargin}px`;
        }
        break;
    }

    setActualPosition(bestPosition);
    setDynamicStyles(styles);
  };

  const showTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => {
      calculateOptimalPosition();
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculateOptimalPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVisible, timeoutId]);

  const getArrowClasses = () => {
    const arrowSize = 4;
    switch (actualPosition) {
      case 'top':
        return `before:content-[''] before:absolute before:top-full before:left-1/2 
                before:transform before:-translate-x-1/2 before:border-${arrowSize} 
                before:border-transparent before:border-t-gray-900 dark:before:border-t-gray-700`;
      case 'bottom':
        return `before:content-[''] before:absolute before:bottom-full before:left-1/2 
                before:transform before:-translate-x-1/2 before:border-${arrowSize} 
                before:border-transparent before:border-b-gray-900 dark:before:border-b-gray-700`;
      case 'left':
        return `before:content-[''] before:absolute before:left-full before:top-1/2 
                before:transform before:-translate-y-1/2 before:border-${arrowSize} 
                before:border-transparent before:border-l-gray-900 dark:before:border-l-gray-700`;
      case 'right':
        return `before:content-[''] before:absolute before:right-full before:top-1/2 
                before:transform before:-translate-y-1/2 before:border-${arrowSize} 
                before:border-transparent before:border-r-gray-900 dark:before:border-r-gray-700`;
      default:
        return '';
    }
  };

  if (!content) return <>{children}</>;

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <div
        ref={tooltipRef}
        className={`
          absolute z-50 px-3 py-2 text-xs font-medium text-white 
          bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg
          break-words whitespace-pre-wrap
          pointer-events-none transition-all duration-200 ease-in-out
          ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}
          ${getArrowClasses()}
        `}
        style={{
          ...dynamicStyles,
          maxWidth: `${getSmartMaxWidth()}px`,
          zIndex: 9999
        }}
        role="tooltip"
        aria-hidden={!isVisible}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
