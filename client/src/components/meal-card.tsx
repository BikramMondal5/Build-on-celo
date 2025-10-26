import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FoodItemWithCreator, FoodClaimWithDetails } from '@shared/schema';

// --- 1. Map Component ---
interface MapComponentProps {
  latitude: number;
  longitude: number;
}

const MapComponent: React.FC<MapComponentProps> = React.memo(({ latitude, longitude }) => {
  const bbox_range = 0.005;
  const minLon = longitude - bbox_range;
  const minLat = latitude - bbox_range;
  const maxLon = longitude + bbox_range;
  const maxLat = latitude + bbox_range;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden border border-gray-300">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        style={{ border: 'none' }}
        title="Location Map"
      />
    </div>
  );
});

MapComponent.displayName = 'MapComponent';

// --- 2. Location Modal Component ---
interface LocationModalProps {
  latitude: number;
  longitude: number;
  onClose: () => void;
  foodName: string;
  isOpen: boolean;
}

const LocationModal: React.FC<LocationModalProps> = React.memo(({
  latitude,
  longitude,
  onClose,
  foodName,
  isOpen,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      closeTimeoutRef.current = setTimeout(() => setIsAnimating(false), 200);
    }

    return () => {
      document.body.style.overflow = '';
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isAnimating) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4 transition-all duration-200 ${
        isOpen ? 'bg-opacity-60 backdrop-blur-sm' : 'bg-opacity-0'
      }`}
      style={{ pointerEvents: 'auto' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Pickup Location for {foodName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-600"
            aria-label="Close modal"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {latitude !== 0 && longitude !== 0 ? (
            <MapComponent latitude={latitude} longitude={longitude} />
          ) : (
            <div className="w-full h-64 md:h-96 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-2" />
                <p>Location coordinates not available</p>
                <p className="text-sm">Contact the canteen for pickup details</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {latitude !== 0 && longitude !== 0 ? (
              <>
                <p>
                  <strong>Latitude:</strong> {latitude}
                </p>
                <p>
                  <strong>Longitude:</strong> {longitude}
                </p>
              </>
            ) : (
              <p className="text-center">
                Location details will be provided by the canteen staff
              </p>
            )}
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            type="button"
          >
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
});

LocationModal.displayName = 'LocationModal';

// --- 3. Meal Card Component ---
interface MealCardProps {
  meal: FoodItemWithCreator;
  onClaim: (foodItemId: string) => void;
  isLoading: boolean;
  userClaims: FoodClaimWithDetails[];
  isPendingApproval?: boolean; // Add this line
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onClaim,
  isLoading,
  userClaims,
  isPendingApproval
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalDataRef = useRef({ latitude: 22.519232, longitude: 88.415007, foodName: meal.name });

  // Update modal data ref when meal changes
  useEffect(() => {
    modalDataRef.current = { latitude: 22.519232, longitude: 88.415007, foodName: meal.name };
  }, [meal.name]);

  // Check if user has already claimed this meal
  const hasClaimed = useMemo(() =>
    userClaims.some(claim =>
      claim.foodItemId === meal.id &&
      (claim.status === 'reserved' || claim.status === 'claimed')
    ),
    [userClaims, meal.id]
  );

  // Check if user has a pending claim for this meal
   const hasPendingClaim = useMemo(() => {
      return userClaims.some(claim => {
        // Compare both _id and id formats to handle populated data
        const claimFoodId = typeof claim.foodItemId === 'object' 
          ? (claim.foodItemId as any).id || (claim.foodItemId as any)._id 
          : claim.foodItemId;
        const mealIdToCompare = (meal as any).id || (meal as any)._id || meal.id;
        return (claimFoodId === mealIdToCompare || claimFoodId === meal.id) && claim.status === 'pending';
      });
    }, [userClaims, meal.id]);

  // Calculate time remaining
  const { hoursRemaining, minutesRemaining, timeRemaining } = useMemo(() => {
    const now = new Date();
    const availableUntil = new Date(meal.availableUntil);
    const timeRemaining = availableUntil.getTime() - now.getTime();
    const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
    const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
    
    return { hoursRemaining, minutesRemaining, timeRemaining };
  }, [meal.availableUntil]);

  const handleOpenModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Opening modal for:', meal.name);
    setIsModalOpen(true);
  }, [meal.name]);

  const handleCloseModal = useCallback(() => {
    console.log('Closing modal for:', meal.name);
    setIsModalOpen(false);
  }, [meal.name]);

  const handleClaim = useCallback(() => {
    onClaim(meal.id);
  }, [onClaim, meal.id]);

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        {/* Image */}
        <div className="relative">
          <img
            className="w-full h-48 object-cover"
            src={meal.imageUrl || 'https://placehold.co/600x400/f87171/white?text=No+Image'}
            alt={meal.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f87171/white?text=Image+Failed';
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              <Clock className="w-3 h-3 mr-1" />
              {hoursRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}m` : 'Expired'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {meal.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {meal.description}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {meal.canteenName}
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 mr-1" />
              <span>{meal.quantityAvailable} available</span>
            </div>

            <button
              onClick={handleOpenModal}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 p-1 rounded-lg hover:bg-blue-50"
              title="Show Pickup Location"
              type="button"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-xs">Map</span>
            </button>
          </div>

          <Button
            onClick={handleClaim}
            disabled={isLoading || hasClaimed || meal.quantityAvailable <= 0 || timeRemaining <= 0 || hasPendingClaim}
            className={`w-full ${
              hasPendingClaim 
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 cursor-not-allowed' 
                : hasClaimed
                ? 'bg-green-100 text-green-800 hover:bg-green-100 cursor-not-allowed'
                : meal.quantityAvailable <= 0 || timeRemaining <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Claiming...
              </div>
            ) : hasPendingClaim ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Pending Approval
              </>
            ) : hasClaimed ? (
              'Already Claimed'
            ) : meal.quantityAvailable <= 0 ? (
              'Out of Stock'
            ) : timeRemaining <= 0 ? (
              'Expired'
            ) : (
              'Claim Meal'
            )}
          </Button>
        </div>
      </div>

      {/* Location Modal - Always render, controlled by isOpen prop */}
      <LocationModal
        latitude={modalDataRef.current.latitude}
        longitude={modalDataRef.current.longitude}
        foodName={modalDataRef.current.foodName}
        onClose={handleCloseModal}
        isOpen={isModalOpen}
      />
    </>
  );
};

// Backward compatibility component
interface FoodCardProps {
  foodName: string;
  description: string;
  imageUrl: string;
  quantity: number;
  latitude: number;
  longitude: number;
}

const FoodCard: React.FC<FoodCardProps> = ({
  foodName,
  description,
  imageUrl,
  quantity,
  latitude,
  longitude,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
        <img
          className="w-full h-48 object-cover"
          src={imageUrl}
          alt={foodName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f87171/white?text=Image+Failed';
          }}
        />

        <div className="p-5">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{foodName}</h3>
          <p className="text-gray-600 text-sm mb-4">{description}</p>

          <div className="flex justify-between items-center">
            <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
              Serves: {quantity}
            </span>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded-lg hover:bg-blue-50"
              title="Show Pickup Location"
            >
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">Show Map</span>
            </button>
          </div>
        </div>
      </div>

      <LocationModal
        latitude={latitude}
        longitude={longitude}
        foodName={foodName}
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      />
    </>
  );
};

export default FoodCard;