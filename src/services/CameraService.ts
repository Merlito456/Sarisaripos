export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  
  async initializeCamera(
    videoElement: HTMLVideoElement,
    options?: { facingMode?: 'user' | 'environment'; timeout?: number }
  ): Promise<MediaStream> {
    this.videoElement = videoElement;
    const timeout = options?.timeout || 10000;
    const facingMode = options?.facingMode || 'environment';
    
    // Ensure we have permissions first
    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) {
      throw new Error('Camera permission denied. Please check your browser settings.');
    }

    try {
      // Try multiple constraints in order of preference
      const constraintsList = [
        // Option 1: Back camera with specific resolution (Full HD)
        {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        },
        // Option 2: Back camera with HD resolution
        {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        // Option 3: Any back camera (less strict)
        {
          video: { facingMode: facingMode },
          audio: false
        },
        // Option 4: Any camera
        {
          video: true,
          audio: false
        },
        // Option 5: Low quality fallback
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        }
      ];
      
      let stream: MediaStream | null = null;
      let lastError: Error | null = null;
      
      // Try each constraint until one works
      for (const constraints of constraintsList) {
        try {
          stream = await this.getUserMediaWithTimeout(constraints, timeout);
          if (stream) break;
        } catch (error) {
          lastError = error as Error;
          console.warn('Camera constraint failed:', constraints, error);
          // Clean up any partially set stream
          if (videoElement.srcObject) {
            (videoElement.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            videoElement.srcObject = null;
          }
          continue;
        }
      }
      
      if (!stream) {
        throw lastError || new Error('No working camera configuration found');
      }
      
      this.stream = stream;
      
      // Set up video element
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.setAttribute('playsinline', 'true');
      
      // Wait for video to be ready with timeout
      await this.waitForVideoReady(videoElement, timeout);
      
      return stream;
      
    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw error;
    }
  }

  private async ensurePermissions(): Promise<boolean> {
    try {
      // Check if permissions are already granted via Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as any });
        if (result.state === 'granted') return true;
        if (result.state === 'denied') return false;
      }

      // Fallback to a quick getUserMedia call to trigger the prompt
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err) {
      console.error('Camera permission check failed:', err);
      return false;
    }
  }
  
  private getUserMediaWithTimeout(
    constraints: MediaStreamConstraints,
    timeout: number
  ): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('getUserMedia timeout'));
      }, timeout);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          clearTimeout(timeoutId);
          resolve(stream);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  private waitForVideoReady(video: HTMLVideoElement, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Final check before timeout
        if (video.readyState >= 2 && video.videoWidth > 0) {
          clearTimeout(timeoutId);
          resolve();
        } else {
          reject(new Error(`Video initialization timed out (readyState: ${video.readyState}, size: ${video.videoWidth}x${video.videoHeight})`));
        }
      }, timeout);
      
      const checkReady = () => {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          clearTimeout(timeoutId);
          resolve();
          return true;
        }
        return false;
      };

      const loop = () => {
        if (!checkReady()) {
          requestAnimationFrame(loop);
        }
      };
      
      video.onloadedmetadata = () => {
        video.play().catch(e => {
          console.warn('Video play failed, might need user interaction:', e);
          // Don't reject yet, readyState might still advance
        });
      };
      
      video.onplaying = () => {
        loop();
      };
      
      video.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Video element error'));
      };
      
      // Ensure attributes are set for mobile/autoplay
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      // Start checking immediately in case it's already ready
      if (checkReady()) return;

      // If metadata is already loaded, try to play
      if (video.readyState >= 1) {
        video.play().catch(() => {});
      }

      // Start loop anyway
      loop();
    });
  }
  
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
  
  async switchCamera(): Promise<void> {
    if (!this.videoElement) return;
    
    const currentFacingMode = this.getCurrentFacingMode();
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    this.stopCamera();
    await this.initializeCamera(this.videoElement, { facingMode: newFacingMode });
  }
  
  private getCurrentFacingMode(): 'user' | 'environment' {
    if (!this.stream) return 'environment';
    
    const track = this.stream.getVideoTracks()[0];
    const settings = track.getSettings();
    
    return (settings.facingMode as 'user' | 'environment') || 'environment';
  }

  async toggleTorch(enabled: boolean): Promise<boolean> {
    if (!this.stream) return false;
    
    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (!capabilities.torch) {
      console.warn('Torch not supported on this device/camera');
      return false;
    }
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: enabled }]
      } as any);
      return true;
    } catch (error) {
      console.error('Failed to toggle torch:', error);
      return false;
    }
  }

  async setZoom(zoom: number): Promise<boolean> {
    if (!this.stream) return false;
    
    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (!capabilities.zoom) {
      return false;
    }
    
    try {
      const min = capabilities.zoom.min || 1;
      const max = capabilities.zoom.max || 1;
      const clampedZoom = Math.min(max, Math.max(min, zoom));
      
      await track.applyConstraints({
        advanced: [{ zoom: clampedZoom }]
      } as any);
      return true;
    } catch (error) {
      console.error('Failed to set zoom:', error);
      return false;
    }
  }

  getZoomCapabilities(): { min: number; max: number; step: number } | null {
    if (!this.stream) return null;
    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (!capabilities.zoom) return null;
    
    return {
      min: capabilities.zoom.min || 1,
      max: capabilities.zoom.max || 1,
      step: capabilities.zoom.step || 0.1
    };
  }

  async enableAutoFocus(): Promise<void> {
    if (!this.stream) return;
    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
      try {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        } as any);
      } catch (e) {
        console.warn('Failed to enable continuous autofocus');
      }
    }
  }

  hasTorch(): boolean {
    if (!this.stream) return false;
    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    return !!capabilities.torch;
  }
}
