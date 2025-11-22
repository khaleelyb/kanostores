import React, { useRef, useState, useEffect } from 'react';
import { Icon } from './Icon';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Initialize camera
  const startCamera = async () => {
    try {
      stopCamera(); // Ensure previous stream is stopped

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        // Wait for video to be ready to play
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Error playing video:", e));
            setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permission in your browser settings.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
          setError('No camera found on this device.');
      } else {
          setError('Could not access camera. Please ensure permissions are granted and no other app is using it.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video actual size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Flip horizontally if using front camera for a mirror effect
        if (facingMode === 'user') {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            stopCamera(); // Stop camera after capture
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button 
            onClick={handleClose}
            className="p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
            <Icon name="close" className="w-8 h-8" />
        </button>
        <button 
            onClick={switchCamera}
            className="p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
             <Icon name="refresh" className="w-8 h-8" /> 
        </button>
      </div>

      {/* Video Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6 max-w-md mx-auto">
            <div className="mb-4 flex justify-center text-red-400">
                <Icon name="close" className="w-12 h-12" />
            </div>
            <p className="text-lg mb-4 font-medium">{error}</p>
            <button onClick={() => startCamera()} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                Try Again
            </button>
            <button onClick={handleClose} className="block mt-4 mx-auto text-gray-400 underline">
                Cancel
            </button>
          </div>
        ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
        )}
      </div>

      {/* Controls */}
      <div className="h-32 bg-black flex items-center justify-center pb-8 pt-4 relative">
        <button 
          onClick={captureImage}
          disabled={!isStreaming}
          className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
