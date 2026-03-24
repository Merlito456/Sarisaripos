import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Barcode, Image as ImageIcon, Zap, RefreshCw, AlertCircle, Type } from 'lucide-react';
import { detectionManager } from '../../detection/DetectionManager';
import { Product } from '../../database/db';
import { toast } from 'react-hot-toast';

interface CameraDetectionProps {
  onProductDetected: (product: Product) => void;
  onMultipleDetected?: (products: Product[]) => void;
  onClose?: () => void;
}

export const CameraDetection: React.FC<CameraDetectionProps> = ({
  onProductDetected,
  onMultipleDetected,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'auto' | 'barcode' | 'photo' | 'text'>('auto');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) {
      setStatus('error');
      setErrorMessage('Video element not found');
      return;
    }
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      await detectionManager.initialize(videoRef.current);
      detectionManager.setMode(mode === 'text' ? 'auto' : mode); // DetectionManager uses auto for background tasks
      setStatus('ready');
      toast.success('Camera ready!');
    } catch (error: any) {
      console.error('Camera initialization failed:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to initialize camera');
      toast.error('Camera initialization failed');
    }
  }, [mode, retryCount]);
  
  useEffect(() => {
    initializeCamera();
    
    return () => {
      detectionManager.stopCamera();
    };
  }, [initializeCamera]);
  
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || status !== 'ready') return;
    
    setIsDetecting(true);
    
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const image = new Image();
      image.src = canvas.toDataURL();
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });
      
      const detections = await detectionManager.detectFromPhoto(image);
      
      if (detections.length > 0 && detections[0].product) {
        onProductDetected(detections[0].product);
        toast.success(`${detections[0].product.name} detected!`);
      } else {
        toast.error('No product detected. Please try again.');
      }
    } catch (error) {
      console.error('Photo detection failed:', error);
      toast.error('Detection failed');
    } finally {
      setIsDetecting(false);
    }
  };

  const captureText = async () => {
    if (!videoRef.current || !canvasRef.current || status !== 'ready') return;
    
    setIsDetecting(true);
    
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const result = await detectionManager.detectFromText(canvas);
      
      if (result.product) {
        onProductDetected(result.product);
        toast.success(`Found: ${result.product.name}`);
      } else if (result.text) {
        toast.error(`Recognized: "${result.text.substring(0, 20)}..." but no product match.`);
      } else {
        toast.error('No text found in image.');
      }
    } catch (error) {
      console.error('Text detection failed:', error);
      toast.error('OCR failed');
    } finally {
      setIsDetecting(false);
    }
  };
  
  const handleRetry = () => {
    detectionManager.stopCamera();
    setRetryCount(prev => prev + 1);
  };
  
  const handleModeChange = (newMode: 'auto' | 'barcode' | 'photo' | 'text') => {
    setMode(newMode);
    if (newMode !== 'text') {
      detectionManager.setMode(newMode);
    }
    toast.success(`${newMode.charAt(0).toUpperCase() + newMode.slice(1)} mode`);
  };
  
  // Loading State
  if (status === 'loading') {
    return (
      <div className="relative bg-black rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Starting camera...</p>
          <p className="text-gray-400 text-sm mt-2">Please allow camera access</p>
        </div>
      </div>
    );
  }
  
  // Error State
  if (status === 'error') {
    return (
      <div className="relative bg-black rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-white mb-2 font-medium">Camera Error</p>
          <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center space-x-2 mx-auto hover:bg-blue-600 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Retry Camera</span>
          </button>
          <p className="text-gray-500 text-xs mt-4">
            Make sure you've granted camera permission
          </p>
        </div>
      </div>
    );
  }
  
  // Ready State
  return (
    <div className="relative bg-black rounded-xl overflow-hidden min-h-[400px]">
      {/* Camera Preview */}
      <video
        ref={videoRef}
        id="camera-preview"
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Mode Selector */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-75 rounded-full p-2 backdrop-blur-sm">
        <button
          onClick={() => handleModeChange('auto')}
          className={`p-3 rounded-full transition-all ${
            mode === 'auto' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Auto Mode"
        >
          <Zap size={20} />
        </button>
        
        <button
          onClick={() => handleModeChange('barcode')}
          className={`p-3 rounded-full transition-all ${
            mode === 'barcode' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Barcode Mode"
        >
          <Barcode size={20} />
        </button>
        
        <button
          onClick={() => handleModeChange('photo')}
          className={`p-3 rounded-full transition-all ${
            mode === 'photo' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Photo Mode"
        >
          <Camera size={20} />
        </button>

        <button
          onClick={() => handleModeChange('text')}
          className={`p-3 rounded-full transition-all ${
            mode === 'text' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Text Mode (OCR)"
        >
          <Type size={20} />
        </button>
        
        {(mode === 'photo' || mode === 'text') && (
          <button
            onClick={mode === 'photo' ? capturePhoto : captureText}
            disabled={isDetecting}
            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all disabled:opacity-50"
            title={mode === 'photo' ? 'Capture Photo' : 'Recognize Text'}
          >
            <ImageIcon size={20} />
          </button>
        )}
      </div>
      
      {/* Instruction Text */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black bg-opacity-50 text-white text-xs px-3 py-1.5 rounded-full inline-block backdrop-blur-sm">
          {mode === 'barcode' && '📱 Position barcode in frame'}
          {mode === 'photo' && '🤖 Tap capture to detect product'}
          {mode === 'text' && '🔍 Tap capture to read product text'}
          {mode === 'auto' && '🔄 Auto-detecting barcode or product'}
        </div>
      </div>
      
      {/* Detection Indicator */}
      {isDetecting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-gray-700">
              {mode === 'text' ? 'Reading text...' : 'Detecting...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
