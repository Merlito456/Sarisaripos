import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Barcode, Zap, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { detectionManager } from '../../detection/DetectionManager';
import { Product, MasterProduct, ProductUnit } from '../../database/db';
import { masterProductService } from '../../services/MasterProductService';
import { UnitSelector } from './UnitSelector';
import { toast } from 'react-hot-toast';

interface FullScreenCameraProps {
  isOpen: boolean;
  mode: 'barcode' | 'photo' | 'auto';
  userId: string;
  onClose: () => void;
  onProductDetected: (product: Product) => void;
  onModeChange?: (mode: 'barcode' | 'photo' | 'auto') => void;
}

export const FullScreenCamera: React.FC<FullScreenCameraProps> = ({
  isOpen,
  mode,
  userId,
  onClose,
  onProductDetected,
  onModeChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetectedBarcode, setLastDetectedBarcode] = useState<string>('');
  const [detectionHistory, setDetectionHistory] = useState<Product[]>([]);
  
  // Unit selection state
  const [isUnitSelectorOpen, setIsUnitSelectorOpen] = useState(false);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState<MasterProduct | null>(null);
  const [availableUnits, setAvailableUnits] = useState<ProductUnit[]>([]);
  const [currentBarcode, setCurrentBarcode] = useState<string>('');
  
  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);
  
  const initializeCamera = async () => {
    setStatus('loading');
    setErrorMessage('');

    // Wait for ref to be available if it's not yet (React ref attachment can sometimes be delayed)
    let attempts = 0;
    while (!videoRef.current && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
    }

    if (!videoRef.current) {
      setStatus('error');
      setErrorMessage('Camera element not found. Please try refreshing the page.');
      return;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('error');
      setErrorMessage('Your browser does not support camera access or is not using a secure connection (HTTPS).');
      return;
    }
    
    try {
      // Initialize detection manager with video element (it will handle camera initialization)
      await detectionManager.initialize(videoRef.current);
      detectionManager.setMode(mode);
      
      // Setup detection callback
      detectionManager.onDetected((result) => {
        if (result.product) {
          handleProductDetected(result);
        }
      });
      
      setStatus('ready');
      toast.success('Camera ready!');
      
    } catch (error: any) {
      console.error('Camera initialization failed:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Unable to access camera. Please check permissions.');
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    detectionManager.stopCamera();
  };
  
  const handleProductDetected = (result: any) => {
    const { product, masterProduct, availableUnits, barcode } = result;
    if (!product) return;

    // If it's a virtual product (not in inventory yet) and we have units to select
    if (!product.id && masterProduct && availableUnits && availableUnits.length > 0) {
      setSelectedMasterProduct(masterProduct);
      setAvailableUnits(availableUnits);
      setCurrentBarcode(barcode || '');
      setIsUnitSelectorOpen(true);
      return;
    }

    // Normal detection (already in inventory)
    processDetectedProduct(product);
  };

  const processDetectedProduct = (product: Product) => {
    // Add to detection history
    setDetectionHistory(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev;
      return [product, ...prev].slice(0, 5);
    });
    setLastDetectedBarcode(product.barcodes?.[0] || product.barcode || '');
    
    // Show success feedback
    toast.success(`${product.name} detected!`, {
      duration: 2000,
      icon: '✅'
    });
    
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
    
    // Add to cart and close modal after short delay
    setTimeout(() => {
      onProductDetected(product);
      onClose();
    }, 500);
  };

  const handleUnitSelect = async (unit: ProductUnit) => {
    if (!selectedMasterProduct) return;

    try {
      // Add to inventory
      const newProduct = await masterProductService.addToInventory(
        selectedMasterProduct.id,
        userId,
        unit.id,
        unit.sellingPrice
      );

      if (newProduct) {
        setIsUnitSelectorOpen(false);
        processDetectedProduct(newProduct);
      }
    } catch (error) {
      console.error('Failed to add unit to inventory:', error);
      toast.error('Failed to add product to inventory');
    }
  };
  
  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current || status !== 'ready') return;
    
    setIsDetecting(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to image
      const image = new Image();
      image.src = canvas.toDataURL('image/jpeg', 0.9);
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });
      
      // Detect products in photo
      const detections = await detectionManager.detectFromPhoto(image);
      
      if (detections.length > 0 && detections[0].product) {
        handleProductDetected(detections[0].product);
      } else {
        toast.error('No product detected. Try again with better lighting.');
      }
    } catch (error) {
      console.error('Detection failed:', error);
      toast.error('Detection failed. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };
  
  const handleModeSwitch = (newMode: 'barcode' | 'photo' | 'auto') => {
    if (onModeChange) {
      onModeChange(newMode);
    }
    // Reinitialize camera with new mode
    stopCamera();
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Camera Preview - Full Screen */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        playsInline
        muted
      />
      
      {/* Hidden Canvas for Photo Capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Loading State Overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">Starting camera...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow camera access</p>
          </div>
        </div>
      )}
      
      {/* Error State Overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg font-medium mb-2">Camera Error</p>
            <p className="text-gray-400 text-sm mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <button
                onClick={initializeCamera}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors"
              >
                <RefreshCw size={18} />
                <span>Retry</span>
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-4">
              Make sure camera permission is granted in browser settings
            </p>
          </div>
        </div>
      )}
      
      {/* Ready State UI Overlays */}
      {status === 'ready' && (
        <>
          {/* Detection Overlay - Scanning Frame */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning Frame Animation */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Corner Frames */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500"></div>
                
                {/* Scanning Line Animation */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-scan"></div>
              </div>
            </div>
            
            {/* Instructions Overlay */}
            <div className="absolute top-8 left-0 right-0 text-center">
              <div className="inline-block bg-black bg-opacity-70 px-4 py-2 rounded-full backdrop-blur-sm">
                <p className="text-white text-sm">
                  {mode === 'barcode' && '📱 Position barcode inside the frame'}
                  {mode === 'photo' && '🤖 Tap camera button to capture product'}
                  {mode === 'auto' && '🔄 Auto-detecting barcode or product'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Detection History (Recent Detections) */}
          {detectionHistory.length > 0 && (
            <div className="absolute bottom-32 left-4 right-4">
              <div className="bg-black bg-opacity-80 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-gray-400 text-xs mb-1">Recently detected:</p>
                <div className="flex space-x-2 overflow-x-auto">
                  {detectionHistory.map((product, idx) => (
                    <div key={idx} className="bg-gray-800 rounded-lg px-3 py-1 whitespace-nowrap">
                      <span className="text-white text-sm">{product.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-8 pb-8">
            <div className="flex justify-center space-x-4 mb-6">
              {/* Mode Selector */}
              <div className="flex space-x-2 bg-black bg-opacity-50 rounded-full p-1 backdrop-blur-sm">
                <button
                  onClick={() => handleModeSwitch('barcode')}
                  className={`px-4 py-2 rounded-full transition-all text-sm font-medium ${
                    mode === 'barcode' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Barcode size={18} className="inline mr-2" />
                  Barcode
                </button>
                <button
                  onClick={() => handleModeSwitch('photo')}
                  className={`px-4 py-2 rounded-full transition-all text-sm font-medium ${
                    mode === 'photo' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Camera size={18} className="inline mr-2" />
                  Photo
                </button>
                <button
                  onClick={() => handleModeSwitch('auto')}
                  className={`px-4 py-2 rounded-full transition-all text-sm font-medium ${
                    mode === 'auto' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Zap size={18} className="inline mr-2" />
                  Auto
                </button>
              </div>
            </div>
            
            <div className="flex justify-center items-center space-x-8">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-12 h-12 bg-gray-800 rounded-full text-white flex items-center justify-center hover:bg-gray-700 transition-all"
              >
                <X size={24} />
              </button>
    
              {/* Capture Button (for Photo Mode) */}
              <button
                onClick={captureAndDetect}
                disabled={isDetecting}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  mode === 'photo' 
                    ? 'bg-white hover:bg-gray-100 scale-110' 
                    : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
              >
                {isDetecting ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                ) : (
                  <Camera size={36} className={mode === 'photo' ? 'text-gray-800' : 'text-white/50'} />
                )}
              </button>
    
              {/* Camera Toggle Button */}
              <button
                onClick={async () => {
                  try {
                    setStatus('loading');
                    await detectionManager.switchCamera();
                    setStatus('ready');
                  } catch (error: any) {
                    console.error('Camera switch failed:', error);
                    setStatus('error');
                    setErrorMessage(error.message || 'Failed to switch camera');
                  }
                }}
                className="w-12 h-12 bg-gray-800 rounded-full text-white flex items-center justify-center hover:bg-gray-700 transition-all"
                title="Switch Camera"
              >
                <RefreshCw size={24} />
              </button>
            </div>
            
            {/* Barcode Detection Status */}
            {mode === 'barcode' && lastDetectedBarcode && (
              <div className="text-center mt-4">
                <p className="text-green-400 text-xs font-medium">
                  Last scanned: {lastDetectedBarcode}
                </p>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Detection Overlay for Photo Mode */}
      {mode === 'photo' && isDetecting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xl">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span className="text-gray-900 font-bold">Analyzing product...</span>
          </div>
        </div>
      )}

      {/* Unit Selection Dialog */}
      {selectedMasterProduct && (
        <UnitSelector
          isOpen={isUnitSelectorOpen}
          product={selectedMasterProduct}
          units={availableUnits}
          onSelect={handleUnitSelect}
          onClose={() => {
            setIsUnitSelectorOpen(false);
            setSelectedMasterProduct(null);
          }}
        />
      )}
    </div>
  );
};
