import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

export interface TourStep {
  id: string;
  target: string; // CSS selector or ID
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showSkip?: boolean;
  action?: {
    text: string;
    onClick: () => void;
  };
}

interface TourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  tourId: string; // Unique identifier for this tour
}

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

const Tour: React.FC<TourProps> = ({ steps, isOpen, onComplete, onSkip, tourId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (isOpen && currentStepData) {
      // Find target element first
      const targetElement = document.querySelector(currentStepData.target);
      
      if (targetElement) {
        // Scroll target into view first
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
        
        // Wait for scroll to complete, then update position and show
        setTimeout(() => {
          updateTargetPosition();
          setIsVisible(true);
        }, 700); // Longer delay to ensure scroll completes
      } else {
        console.warn(`Tour target not found during initial setup: ${currentStepData.target}`);
        // For the first step, retry finding the target
        if (currentStep === 0) {
          const retryTimer = setTimeout(() => {
            const retryElement = document.querySelector(currentStepData.target);
            if (retryElement) {
              retryElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              });
              setTimeout(() => {
                updateTargetPosition();
                setIsVisible(true);
              }, 700);
            } else {
              console.error(`Tour target still not found after retry: ${currentStepData.target}`);
              // Show anyway with fallback
              updateTargetPosition();
              setIsVisible(true);
            }
          }, 300);
          return () => clearTimeout(retryTimer);
        } else {
          // For other steps, show with fallback position
          updateTargetPosition();
          setIsVisible(true);
        }
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, currentStep, currentStepData]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && currentStepData) {
        setTimeout(() => {
          updateTargetPosition();
        }, 100);
      }
    };

    const handleScroll = () => {
      if (isOpen && currentStepData) {
        updateTargetPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, currentStepData]);

  // Additional effect to recalculate position after tooltip renders
  useEffect(() => {
    if (isVisible && targetPosition && tooltipRef.current) {
      // Recalculate position after tooltip has been rendered
      const timer = setTimeout(() => {
        updateTargetPosition();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, currentStep]);

  const updateTargetPosition = () => {
    if (!currentStepData) return;

    const targetElement = document.querySelector(currentStepData.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      console.log(`Tour targeting: ${currentStepData.target}`, {
        element: targetElement,
        rect: rect,
        viewportPosition: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }
      });
      
      // Use viewport coordinates for highlight (fixed positioning)
      setTargetPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      console.warn(`Tour target not found: ${currentStepData.target}`);
      // For specific selectors, try alternative fallbacks
      if (currentStepData.target === '[data-tour="dashboard"]') {
        // Try to find main dashboard container
        const dashboardContainer = document.querySelector('.dashboard-container') || 
                                 document.querySelector('[role="main"]') ||
                                 document.querySelector('main');
        if (dashboardContainer) {
          const rect = dashboardContainer.getBoundingClientRect();
          setTargetPosition({
            top: rect.top + window.scrollY + 50, // Offset from top
            left: rect.left + window.scrollX,
            width: rect.width,
            height: 100,
          });
          return;
        }
      }
      
      // Set a fallback position to center of screen
      setTargetPosition({
        top: window.innerHeight / 2 - 50,
        left: window.innerWidth / 2 - 100,
        width: 200,
        height: 100,
      });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Hide current step first
      setIsVisible(false);
      
      // Move to next step with a delay
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 150);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      // Hide current step first
      setIsVisible(false);
      
      // Move to previous step with a delay
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 150);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    onComplete();
    // Store completion in localStorage
    localStorage.setItem(`tour_completed_${tourId}`, 'true');
  };

  const skipTour = () => {
    setIsVisible(false);
    onSkip();
    // Store skip in localStorage
    localStorage.setItem(`tour_skipped_${tourId}`, 'true');
  };

  const getTooltipPosition = (): React.CSSProperties => {
    if (!targetPosition || !tooltipRef.current) {
      // Fallback to center of visible viewport if positioning fails
      return {
        top: '50vh',
        left: '50vw',
        transform: 'translate(-50%, -50%)',
        position: 'fixed'
      };
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const position = currentStepData.position || 'bottom';
    const spacing = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;
    const minBottomMargin = 100; // Extra space to ensure buttons are visible

    // Target position is already in viewport coordinates, use it directly
    let top = 0;
    let left = 0;

    // Calculate initial position based on preferred position
    switch (position) {
      case 'top':
        top = targetPosition.top - tooltipRect.height - spacing;
        left = targetPosition.left + (targetPosition.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetPosition.top + (targetPosition.height - tooltipRect.height) / 2;
        left = targetPosition.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = targetPosition.top + (targetPosition.height - tooltipRect.height) / 2;
        left = targetPosition.left + targetPosition.width + spacing;
        break;
      case 'bottom':
      default:
        top = targetPosition.top + targetPosition.height + spacing;
        left = targetPosition.left + (targetPosition.width - tooltipRect.width) / 2;
        break;
    }

    // Horizontal adjustments
    if (left < margin) {
      left = margin;
    } else if (left + tooltipRect.width > viewportWidth - margin) {
      left = viewportWidth - tooltipRect.width - margin;
    }

    // Vertical adjustments - ensure tooltip fits in viewport
    if (top < margin) {
      // If tooltip would go above viewport, position it below the target
      top = targetPosition.top + targetPosition.height + spacing;
    } 
    
    // Check if tooltip extends below viewport
    if (top + tooltipRect.height > viewportHeight - minBottomMargin) {
      // Try positioning above the target
      const newTop = targetPosition.top - tooltipRect.height - spacing;
      if (newTop >= margin) {
        top = newTop;
      } else {
        // If neither above nor below works, center it in viewport
        top = Math.max(margin, (viewportHeight - tooltipRect.height) / 2);
      }
    }

    // Final safety check - ensure tooltip is visible
    if (top < 0) top = margin;
    if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - minBottomMargin;
    }
    if (left < 0) left = margin;
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - margin;
    }

    // Use fixed positioning since we're working with viewport coordinates
    return { 
      top, 
      left,
      position: 'fixed'
    };
  };

  if (!isVisible || !currentStepData || !targetPosition) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={skipTour}
      />
      
      {/* Highlight cutout */}
      <div
        className="absolute border-4 border-white dark:border-yellow-400 rounded-lg shadow-lg pointer-events-none transition-all duration-300"
        style={{
          top: targetPosition.top - 4,
          left: targetPosition.left - 4,
          width: targetPosition.width + 8,
          height: targetPosition.height + 8,
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 transform transition-all duration-300 z-[201]"
        style={{
          position: 'fixed',
          ...getTooltipPosition(),
          maxWidth: 'calc(100vw - 40px)',
          width: 'clamp(280px, 90vw, 400px)',
          maxHeight: 'calc(100vh - 120px)', // More conservative height
          minHeight: '200px', // Ensure minimum height for buttons
          overflow: 'auto'
        }}
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {currentStepData.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
          {currentStepData.content}
        </p>

        {/* Action button if provided */}
        {currentStepData.action && (
          <button
            onClick={currentStepData.action.onClick}
            className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            {currentStepData.action.text}
          </button>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex space-x-2 justify-start">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors flex items-center"
              >
                <Icon icon="chevron-left" className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
          </div>

          <div className="flex space-x-2 justify-end">
            {(currentStepData.showSkip !== false) && (
              <button
                onClick={skipTour}
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Skip Tour
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium flex items-center min-w-[80px] justify-center"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
              {currentStep < steps.length - 1 && (
                <Icon icon="chevron-right" className="w-4 h-4 ml-1" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage tour state
export const useTour = (tourId: string) => {
  const [isOpen, setIsOpen] = useState(false);

  const startTour = () => {
    setIsOpen(true);
  };

  const completeTour = () => {
    setIsOpen(false);
  };

  const skipTour = () => {
    setIsOpen(false);
  };

  const hasCompletedTour = () => {
    return localStorage.getItem(`tour_completed_${tourId}`) === 'true';
  };

  const hasSkippedTour = () => {
    return localStorage.getItem(`tour_skipped_${tourId}`) === 'true';
  };

  const shouldShowTour = () => {
    return !hasCompletedTour() && !hasSkippedTour();
  };

  const resetTour = () => {
    localStorage.removeItem(`tour_completed_${tourId}`);
    localStorage.removeItem(`tour_skipped_${tourId}`);
  };

  return {
    isOpen,
    startTour,
    completeTour,
    skipTour,
    hasCompletedTour,
    hasSkippedTour,
    shouldShowTour,
    resetTour,
  };
};

export default Tour;
