import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter
} from '@angular/core';

export interface CameraCapturedEvent {
  type: 'image' | 'video';
  url: string;
  fileName: string;
  fileSizeStr: string;
  mimeType: string;
  duration?: string;
}

@Component({
  selector: 'app-camera-modal',
  templateUrl: './camera-modal.component.html',
  styleUrls: ['./camera-modal.component.css']
})
export class CameraModalComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();
  @Output() capturedMedia = new EventEmitter<CameraCapturedEvent>();

  @ViewChild('videoElement') videoElementRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('previewVideoElement') previewVideoElementRef?: ElementRef<HTMLVideoElement>;

  // Camera stream state
  mediaStream: MediaStream | null = null;
  currentFacingMode: 'user' | 'environment' = 'user';
  availableVideoDevices: MediaDeviceInfo[] = [];
  hasMultipleCameras = false;

  // Mode: 'photo' | 'video'
  cameraMode: 'photo' | 'video' = 'photo';

  // Permission & Error states
  isLoadingCamera = true;
  permissionError: string | null = null;
  isPermissionDenied = false;

  // Photo Capture State
  capturedPhotoUrl: string | null = null;

  // Video Recording State
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  isRecording = false;
  recordingSeconds = 0;
  private recordingTimer: any = null;
  capturedVideoUrl: string | null = null;
  capturedVideoBlob: Blob | null = null;
  recordedVideoDurationStr = '';

  ngOnInit(): void {
    this.checkAvailableCameras().then(() => {
      this.initCameraStream();
    });
  }

  ngOnDestroy(): void {
    this.stopCameraStream();
    this.clearRecordingTimer();
  }

  // --- Device & Camera Discovery ---
  async checkAvailableCameras(): Promise<void> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.availableVideoDevices = devices.filter(d => d.kind === 'videoinput');
        this.hasMultipleCameras = this.availableVideoDevices.length > 1;
      }
    } catch (e) {
      this.hasMultipleCameras = true; // allow attempt to toggle facing mode
    }
  }

  // --- Initialize Real Device Camera ---
  async initCameraStream(): Promise<void> {
    this.stopCameraStream();
    this.isLoadingCamera = true;
    this.permissionError = null;
    this.isPermissionDenied = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.isLoadingCamera = false;
      this.permissionError = 'Camera access is not supported on this browser or environment.';
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: this.cameraMode === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;
      this.isLoadingCamera = false;

      // Attach stream to live video element
      setTimeout(() => {
        if (this.videoElementRef && this.videoElementRef.nativeElement) {
          this.videoElementRef.nativeElement.srcObject = stream;
          this.videoElementRef.nativeElement.play().catch(() => {});
        }
      }, 50);
    } catch (err: any) {
      this.isLoadingCamera = false;
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.isPermissionDenied = true;
        this.permissionError = 'Camera permission was denied. Please allow camera access in your browser settings to take photos or record videos.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        this.permissionError = 'No camera device was found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        this.permissionError = 'Camera is currently in use by another application. Please close other camera apps and retry.';
      } else {
        this.permissionError = `Unable to access camera: ${err.message || 'Unknown error'}.`;
      }
    }
  }

  stopCameraStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.mediaStream = null;
    }
    if (this.videoElementRef && this.videoElementRef.nativeElement) {
      this.videoElementRef.nativeElement.srcObject = null;
    }
  }

  // --- Switch Modes (Photo vs Video) ---
  switchMode(mode: 'photo' | 'video'): void {
    if (this.cameraMode === mode || this.isRecording) return;
    this.cameraMode = mode;
    this.discardCapture();
    // Restart stream to include/exclude audio track appropriately
    this.initCameraStream();
  }

  // --- Switch Front/Rear Camera ---
  switchCamera(): void {
    if (this.isRecording) return;
    this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    this.initCameraStream();
  }

  // --- Retry Permission ---
  retryPermission(): void {
    this.initCameraStream();
  }

  // --- Take Photo ---
  capturePhoto(): void {
    if (!this.videoElementRef || !this.videoElementRef.nativeElement) return;
    const video = this.videoElementRef.nativeElement;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image for natural selfie feel
    if (this.currentFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.capturedPhotoUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.stopCameraStream();
  }

  // --- Record Video ---
  startVideoRecording(): void {
    if (!this.mediaStream || this.isRecording) return;

    // Check if audio track is present
    const hasAudio = this.mediaStream.getAudioTracks().length > 0;
    if (!hasAudio) {
      // Reacquire with audio before recording
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.currentFacingMode },
        audio: true
      }).then(stream => {
        this.mediaStream = stream;
        if (this.videoElementRef && this.videoElementRef.nativeElement) {
          this.videoElementRef.nativeElement.srcObject = stream;
          this.videoElementRef.nativeElement.play().catch(() => {});
        }
        this.beginMediaRecorder(stream);
      }).catch(() => {
        // Fallback to recording without audio if mic access failed
        this.beginMediaRecorder(this.mediaStream!);
      });
    } else {
      this.beginMediaRecorder(this.mediaStream);
    }
  }

  private beginMediaRecorder(stream: MediaStream): void {
    this.recordedChunks = [];
    let options: MediaRecorderOptions = {};

    const preferredTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of preferredTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        options = { mimeType: type };
        break;
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      this.capturedVideoBlob = blob;

      const reader = new FileReader();
      reader.onloadend = () => {
        this.capturedVideoUrl = reader.result as string;
        this.stopCameraStream();
      };
      reader.readAsDataURL(blob);
    };

    this.mediaRecorder.start(1000);
    this.isRecording = true;
    this.recordingSeconds = 0;
    this.startRecordingTimer();
  }

  stopVideoRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.clearRecordingTimer();
    this.recordedVideoDurationStr = this.formatTimer(this.recordingSeconds);
    this.isRecording = false;
    try {
      this.mediaRecorder.stop();
    } catch (e) {}
  }

  private startRecordingTimer(): void {
    this.clearRecordingTimer();
    this.recordingTimer = setInterval(() => {
      this.recordingSeconds++;
    }, 1000);
  }

  private clearRecordingTimer(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  formatTimer(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // --- Preview Screen Actions ---
  retake(): void {
    this.discardCapture();
    this.initCameraStream();
  }

  cancel(): void {
    this.discardCapture();
    this.stopCameraStream();
    this.closeModal.emit();
  }

  discardCapture(): void {
    this.capturedPhotoUrl = null;
    this.capturedVideoUrl = null;
    this.capturedVideoBlob = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingSeconds = 0;
    this.clearRecordingTimer();
  }

  send(): void {
    const timestamp = new Date();
    const timeId = timestamp.getTime();

    if (this.capturedPhotoUrl) {
      // Photo Send
      const approxSizeBytes = Math.round((this.capturedPhotoUrl.length * 3) / 4);
      const sizeStr = this.formatFileSize(approxSizeBytes);

      this.capturedMedia.emit({
        type: 'image',
        url: this.capturedPhotoUrl,
        fileName: `Photo_${timeId}.jpg`,
        fileSizeStr: sizeStr,
        mimeType: 'image/jpeg'
      });

      this.cancel();
    } else if (this.capturedVideoUrl) {
      // Video Send
      const sizeBytes = this.capturedVideoBlob ? this.capturedVideoBlob.size : Math.round((this.capturedVideoUrl.length * 3) / 4);
      const sizeStr = this.formatFileSize(sizeBytes);
      const mimeType = this.capturedVideoBlob ? this.capturedVideoBlob.type : 'video/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

      this.capturedMedia.emit({
        type: 'video',
        url: this.capturedVideoUrl,
        fileName: `Video_${timeId}.${ext}`,
        fileSizeStr: sizeStr,
        mimeType: mimeType,
        duration: this.recordedVideoDurationStr || this.formatTimer(this.recordingSeconds)
      });

      this.cancel();
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  }
}
