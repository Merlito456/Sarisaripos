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
    
    try {
      // Try multiple constraints in order of preference
      const constraintsList = [
        // Option 1: Back camera with specific resolution
        {
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        // Option 2: Back camera any resolution
        {
          video: {
            facingMode: { exact: facingMode }
          },
          audio: false
        },
        // Option 3: Any camera
        {
          video: true,
          audio: false
        },
        // Option 4: Low quality fallback
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
      
      // Wait for video to be ready with timeout
      await this.waitForVideoReady(videoElement, timeout);
      
      return stream;
      
    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw error;
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
        reject(new Error('Video initialization timed out'));
      }, timeout);
      
      const checkReady = () => {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          clearTimeout(timeoutId);
          resolve();
        } else {
          requestAnimationFrame(checkReady);
        }
      };
      
      video.onloadedmetadata = () => {
        video.play().catch(reject);
      };
      
      video.onplaying = () => {
        checkReady();
      };
      
      video.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Video element error'));
      };
      
      // Start checking immediately
      checkReady();
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
}
