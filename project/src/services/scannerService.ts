export interface ScannerDevice {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  isAvailable: boolean;
  capabilities: ScannerCapabilities;
}

export interface ScannerCapabilities {
  supportedResolutions: number[];
  supportedColorModes: ('color' | 'grayscale' | 'blackwhite')[];
  supportsDuplex: boolean;
  supportsADF: boolean;
  maxScanArea: { width: number; height: number };
  supportedFormats: string[];
}

export interface ScanSettings {
  resolution: number;
  colorMode: 'color' | 'grayscale' | 'blackwhite';
  useDuplex: boolean;
  useADF: boolean;
  format: 'pdf' | 'jpeg' | 'png' | 'tiff';
  pageSize: 'auto' | 'letter' | 'a4' | 'legal';
  brightness: number;
  contrast: number;
}

export interface ScannedDocument {
  id: string;
  data: Blob;
  pageCount: number;
  format: string;
  timestamp: Date;
  settings: ScanSettings;
}

class ScannerService {
  private isInitialized = false;
  private currentScanner: ScannerDevice | null = null;
  private scanInProgress = false;

  async initialize(): Promise<boolean> {
    try {
      console.log('[Scanner Service] Initializing scanner service...');

      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Scanner access permission denied');
      }

      this.isInitialized = true;
      console.log('[Scanner Service] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Scanner Service] Initialization failed:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      if ('permissions' in navigator) {
        return true;
      }
      return true;
    } catch (error) {
      console.error('[Scanner Service] Permission check failed:', error);
      return false;
    }
  }

  async detectScanners(): Promise<ScannerDevice[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[Scanner Service] Detecting scanners...');

      const mockScanners: ScannerDevice[] = [
        {
          id: 'scanner-001',
          name: 'Canon imageFORMULA DR-C225',
          manufacturer: 'Canon',
          model: 'DR-C225',
          isAvailable: true,
          capabilities: {
            supportedResolutions: [150, 200, 300, 400, 600],
            supportedColorModes: ['color', 'grayscale', 'blackwhite'],
            supportsDuplex: true,
            supportsADF: true,
            maxScanArea: { width: 8.5, height: 14 },
            supportedFormats: ['pdf', 'jpeg', 'png', 'tiff'],
          },
        },
        {
          id: 'scanner-002',
          name: 'Epson WorkForce ES-500W',
          manufacturer: 'Epson',
          model: 'ES-500W',
          isAvailable: true,
          capabilities: {
            supportedResolutions: [150, 300, 600, 1200],
            supportedColorModes: ['color', 'grayscale', 'blackwhite'],
            supportsDuplex: true,
            supportsADF: true,
            maxScanArea: { width: 8.5, height: 11.7 },
            supportedFormats: ['pdf', 'jpeg', 'png'],
          },
        },
      ];

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log(`[Scanner Service] Found ${mockScanners.length} scanner(s)`);
      return mockScanners;
    } catch (error) {
      console.error('[Scanner Service] Scanner detection failed:', error);
      throw new Error('Failed to detect scanners');
    }
  }

  async selectScanner(scannerId: string): Promise<boolean> {
    try {
      const scanners = await this.detectScanners();
      const scanner = scanners.find(s => s.id === scannerId);

      if (!scanner) {
        throw new Error('Scanner not found');
      }

      if (!scanner.isAvailable) {
        throw new Error('Scanner is not available');
      }

      this.currentScanner = scanner;
      console.log('[Scanner Service] Scanner selected:', scanner.name);
      return true;
    } catch (error) {
      console.error('[Scanner Service] Scanner selection failed:', error);
      throw error;
    }
  }

  getCurrentScanner(): ScannerDevice | null {
    return this.currentScanner;
  }

  async acquireImage(settings: Partial<ScanSettings>): Promise<ScannedDocument> {
    if (!this.currentScanner) {
      throw new Error('No scanner selected');
    }

    if (this.scanInProgress) {
      throw new Error('Scan already in progress');
    }

    try {
      this.scanInProgress = true;
      console.log('[Scanner Service] Starting scan with settings:', settings);

      const defaultSettings: ScanSettings = {
        resolution: 300,
        colorMode: 'color',
        useDuplex: false,
        useADF: false,
        format: 'pdf',
        pageSize: 'auto',
        brightness: 0,
        contrast: 0,
      };

      const scanSettings = { ...defaultSettings, ...settings };

      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockImageData = this.generateMockImageBlob(scanSettings);

      const scannedDoc: ScannedDocument = {
        id: `scan-${Date.now()}`,
        data: mockImageData,
        pageCount: scanSettings.useADF ? Math.floor(Math.random() * 5) + 1 : 1,
        format: scanSettings.format,
        timestamp: new Date(),
        settings: scanSettings,
      };

      console.log('[Scanner Service] Scan completed:', scannedDoc.id);
      return scannedDoc;
    } catch (error) {
      console.error('[Scanner Service] Scan failed:', error);
      throw new Error('Failed to acquire image from scanner');
    } finally {
      this.scanInProgress = false;
    }
  }

  async scanDocument(settings: Partial<ScanSettings>): Promise<ScannedDocument> {
    return this.acquireImage(settings);
  }

  async batchScan(
    settings: Partial<ScanSettings>,
    pageCount: number = 10
  ): Promise<ScannedDocument[]> {
    if (!this.currentScanner) {
      throw new Error('No scanner selected');
    }

    const documents: ScannedDocument[] = [];

    for (let i = 0; i < pageCount; i++) {
      const doc = await this.acquireImage(settings);
      documents.push(doc);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return documents;
  }

  async preview(settings: Partial<ScanSettings>): Promise<string> {
    if (!this.currentScanner) {
      throw new Error('No scanner selected');
    }

    try {
      console.log('[Scanner Service] Generating preview...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 280;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = settings.colorMode === 'blackwhite' ? '#000000' : '#cccccc';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Preview', canvas.width / 2, canvas.height / 2);
        ctx.fillText(`${settings.resolution || 300} DPI`, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText(settings.colorMode || 'color', canvas.width / 2, canvas.height / 2 + 60);
      }

      return canvas.toDataURL('image/jpeg');
    } catch (error) {
      console.error('[Scanner Service] Preview failed:', error);
      throw new Error('Failed to generate preview');
    }
  }

  cancelScan(): void {
    if (this.scanInProgress) {
      console.log('[Scanner Service] Cancelling scan...');
      this.scanInProgress = false;
    }
  }

  isScanInProgress(): boolean {
    return this.scanInProgress;
  }

  isReady(): boolean {
    return this.isInitialized && this.currentScanner !== null;
  }

  private generateMockImageBlob(settings: ScanSettings): Blob {
    const canvas = document.createElement('canvas');
    const dpi = settings.resolution;
    const scale = dpi / 96;

    canvas.width = 8.5 * 96 * scale;
    canvas.height = 11 * 96 * scale;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = settings.colorMode === 'blackwhite' ? '#000000' : '#333333';
      ctx.font = `${48 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Scanned Document', canvas.width / 2, canvas.height / 2);
      ctx.font = `${24 * scale}px Arial`;
      ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 60 * scale);
    }

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, `image/${settings.format === 'pdf' ? 'jpeg' : settings.format}`);
    }) as any;
  }

  async shutdown(): Promise<void> {
    console.log('[Scanner Service] Shutting down...');
    this.cancelScan();
    this.currentScanner = null;
    this.isInitialized = false;
  }
}

export const scannerService = new ScannerService();
