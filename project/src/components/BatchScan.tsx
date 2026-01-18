import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  FolderIcon,
  User,
  Shield,
  Tag,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Clock,
  Scan,
  Eye,
  RefreshCw,
  Loader,
  AlertCircle,
  Check,
  Monitor,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  scannerService,
  ScannerDevice,
  ScanSettings,
  ScannedDocument as ScannerScannedDocument,
} from '../services/scannerService';

interface BatchScanSession {
  id: string;
  name: string;
  scan_mode: 'single' | 'batch';
  folder_id: string | null;
  department_id: string;
  default_confidentiality: string;
  assigned_to: string | null;
  default_tags: string[];
  status: 'active' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

interface ScannedDocument {
  id: string;
  file_name: string;
  page_count: number;
  scan_resolution: string;
  color_mode: 'color' | 'grayscale' | 'blackwhite';
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
}

interface DepartmentUser {
  id: string;
  full_name: string;
  email: string;
}

export default function BatchScan() {
  const { t } = useTranslation();
  const { user, currentDepartment } = useApp();
  const [scanMode, setScanMode] = useState<'single' | 'batch'>('single');
  const [showSettings, setShowSettings] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentSession, setCurrentSession] = useState<BatchScanSession | null>(null);
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [users, setUsers] = useState<DepartmentUser[]>([]);
  const [sessions, setSessions] = useState<BatchScanSession[]>([]);

  const [scanners, setScanners] = useState<ScannerDevice[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>('');
  const [scannerReady, setScannerReady] = useState(false);
  const [detectingScanner, setDetectingScanner] = useState(false);
  const [scanningInProgress, setScanningInProgress] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [sessionName, setSessionName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [confidentiality, setConfidentiality] = useState<string>('internal');
  const [assignedUser, setAssignedUser] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [resolution, setResolution] = useState(300);
  const [colorMode, setColorMode] = useState<'color' | 'grayscale' | 'blackwhite'>('color');
  const [useDuplex, setUseDuplex] = useState(false);
  const [useADF, setUseADF] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [pageSize, setPageSize] = useState<'auto' | 'letter' | 'a4' | 'legal'>('auto');
  const [scanFormat, setScanFormat] = useState<'pdf' | 'jpeg' | 'png' | 'tiff'>('pdf');

  useEffect(() => {
    if (currentDepartment) {
      loadFolders();
      loadUsers();
      loadSessions();
    }
  }, [currentDepartment]);

  useEffect(() => {
    initializeScanner();

    return () => {
      scannerService.shutdown();
    };
  }, []);

  const initializeScanner = async () => {
    try {
      await scannerService.initialize();
      await detectScanners();
    } catch (error) {
      console.error('Failed to initialize scanner:', error);
    }
  };

  const detectScanners = async () => {
    setDetectingScanner(true);
    try {
      const devices = await scannerService.detectScanners();
      setScanners(devices);
      if (devices.length > 0) {
        setSelectedScanner(devices[0].id);
        await scannerService.selectScanner(devices[0].id);
        setScannerReady(true);
      }
    } catch (error) {
      console.error('Failed to detect scanners:', error);
    } finally {
      setDetectingScanner(false);
    }
  };

  const handleScannerChange = async (scannerId: string) => {
    setSelectedScanner(scannerId);
    try {
      await scannerService.selectScanner(scannerId);
      setScannerReady(true);
    } catch (error) {
      console.error('Failed to select scanner:', error);
      setScannerReady(false);
    }
  };

  const loadFolders = async () => {
    if (!currentDepartment) return;

    const { data, error } = await supabase
      .from('folders')
      .select('id, name')
      .eq('department_id', currentDepartment.id)
      .order('name');

    if (!error && data) {
      setFolders(data);
    }
  };

  const loadUsers = async () => {
    if (!currentDepartment) return;

    const { data, error } = await supabase
      .from('department_members')
      .select('user_id, users(id, full_name, email)')
      .eq('department_id', currentDepartment.id);

    if (!error && data) {
      const usersData = data
        .map(item => item.users as unknown as DepartmentUser)
        .filter(Boolean);
      setUsers(usersData);
    }
  };

  const loadSessions = async () => {
    if (!currentDepartment) return;

    const { data, error } = await supabase
      .from('batch_scan_sessions')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setSessions(data);
    }
  };

  const startSession = async () => {
    if (!currentDepartment || !user || !sessionName.trim()) {
      alert(t('batchScan.enterSessionName'));
      return;
    }

    if (!scannerReady) {
      alert(t('batchScan.noScannerAvailable'));
      return;
    }

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    const { data, error } = await supabase
      .from('batch_scan_sessions')
      .insert({
        name: sessionName,
        scan_mode: scanMode,
        folder_id: selectedFolder || null,
        department_id: currentDepartment.id,
        default_confidentiality: confidentiality,
        assigned_to: assignedUser || null,
        default_tags: tagsArray,
        status: 'active',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      alert(t('batchScan.sessionCreateError'));
      return;
    }

    setCurrentSession(data);
    setIsScanning(true);
    setShowSettings(false);
    await loadSessions();
  };

  const performScan = async () => {
    if (!currentSession || !currentDepartment || !user || !scannerReady) {
      return;
    }

    setScanningInProgress(true);
    try {
      const scanSettings: Partial<ScanSettings> = {
        resolution,
        colorMode,
        useDuplex,
        useADF,
        format: scanFormat,
        pageSize,
        brightness,
        contrast,
      };

      const scannedDoc = await scannerService.scanDocument(scanSettings);

      const fileName = `scan_${Date.now()}.${scanSettings.format}`;
      const file = new File([scannedDoc.data], fileName, {
        type: `image/${scanSettings.format}`,
      });

      const fileData = {
        name: fileName,
        file_type: file.type,
        file_size: file.size,
        file_url: `mock://scanned/${fileName}`,
        folder_id: currentSession.folder_id,
        department_id: currentDepartment.id,
        uploaded_by: user.id,
        status: 'approved',
        confidentiality: currentSession.default_confidentiality,
        tags: currentSession.default_tags,
        scan_source: scanMode === 'single' ? 'single_scan' : 'batch_scan',
        page_count: scannedDoc.pageCount,
      };

      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single();

      if (fileError || !fileRecord) {
        throw new Error('Failed to save file record');
      }

      const { data: scannedDocRecord, error: scanError } = await supabase
        .from('scanned_documents')
        .insert({
          batch_session_id: currentSession.id,
          file_id: fileRecord.id,
          scan_order: scannedDocs.length + 1,
          page_count: scannedDoc.pageCount,
          scan_resolution: `${resolution}dpi`,
          color_mode: colorMode,
        })
        .select()
        .single();

      if (!scanError && scannedDocRecord) {
        setScannedDocs(prev => [
          ...prev,
          {
            id: scannedDocRecord.id,
            file_name: fileName,
            page_count: scannedDoc.pageCount,
            scan_resolution: `${resolution}dpi`,
            color_mode: colorMode,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      await supabase.from('recent_activity').insert({
        user_id: user.id,
        department_id: currentDepartment.id,
        activity_type: 'upload',
        entity_type: 'file',
        entity_id: fileRecord.id,
        entity_name: fileName,
        description: `Scanned document: ${fileName}`,
      });
    } catch (error) {
      console.error('Scan failed:', error);
      alert(t('batchScan.scanFailed'));
    } finally {
      setScanningInProgress(false);
    }
  };

  const generatePreview = async () => {
    if (!scannerReady) return;

    try {
      const scanSettings: Partial<ScanSettings> = {
        resolution,
        colorMode,
        pageSize,
        brightness,
        contrast,
      };

      const preview = await scannerService.preview(scanSettings);
      setPreviewImage(preview);
    } catch (error) {
      console.error('Preview failed:', error);
      alert(t('batchScan.previewFailed'));
    }
  };

  const completeSession = async () => {
    if (!currentSession) return;

    const { error } = await supabase
      .from('batch_scan_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', currentSession.id);

    if (!error) {
      setIsScanning(false);
      setCurrentSession(null);
      setScannedDocs([]);
      setSessionName('');
      setShowSettings(true);
      setPreviewImage(null);
      await loadSessions();
    }
  };

  const cancelSession = async () => {
    if (!currentSession) return;

    const { error } = await supabase
      .from('batch_scan_sessions')
      .update({
        status: 'cancelled',
      })
      .eq('id', currentSession.id);

    if (!error) {
      setIsScanning(false);
      setCurrentSession(null);
      setScannedDocs([]);
      setSessionName('');
      setShowSettings(true);
      setPreviewImage(null);
      await loadSessions();
    }
  };

  const deleteDocument = async (docId: string) => {
    const { error } = await supabase.from('scanned_documents').delete().eq('id', docId);

    if (!error) {
      setScannedDocs(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  const currentScannerDevice = scanners.find(s => s.id === selectedScanner);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('batchScan.title')}</h1>
        <p className="text-gray-600">{t('batchScan.description')}</p>
      </div>

      {!isScanning ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                {t('batchScan.scannerSetup')}
              </h2>
              <button
                onClick={detectScanners}
                disabled={detectingScanner}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                <RefreshCw className={`w-4 h-4 ${detectingScanner ? 'animate-spin' : ''}`} />
                {t('batchScan.detectScanners')}
              </button>
            </div>

            {detectingScanner ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">{t('batchScan.detectingScanner')}</span>
              </div>
            ) : scanners.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900">{t('batchScan.noScannerFound')}</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('batchScan.noScannerFoundDesc')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('batchScan.selectScanner')}
                </label>
                <select
                  value={selectedScanner}
                  onChange={e => handleScannerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {scanners.map(scanner => (
                    <option key={scanner.id} value={scanner.id}>
                      {scanner.name} - {scanner.manufacturer} {scanner.model}
                    </option>
                  ))}
                </select>

                {currentScannerDevice && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>
                        {t('batchScan.duplex')}: {currentScannerDevice.capabilities.supportsDuplex ? t('common.yes') : t('common.no')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>
                        {t('batchScan.adf')}: {currentScannerDevice.capabilities.supportsADF ? t('common.yes') : t('common.no')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('batchScan.scanSettings')}
              </h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showSettings ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {showSettings && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('batchScan.sessionName')}
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('batchScan.sessionNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('batchScan.scanMode')}
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setScanMode('single')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        scanMode === 'single'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <FileText className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-medium">{t('batchScan.singleMode')}</div>
                      <div className="text-xs mt-1">{t('batchScan.singleModeDesc')}</div>
                    </button>
                    <button
                      onClick={() => setScanMode('batch')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        scanMode === 'batch'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Upload className="w-5 h-5 mx-auto mb-1" />
                      <div className="font-medium">{t('batchScan.batchMode')}</div>
                      <div className="text-xs mt-1">{t('batchScan.batchModeDesc')}</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FolderIcon className="w-4 h-4" />
                      {t('batchScan.storagePath')}
                    </label>
                    <select
                      value={selectedFolder}
                      onChange={e => setSelectedFolder(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('batchScan.rootFolder')}</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {t('batchScan.securityLevel')}
                    </label>
                    <select
                      value={confidentiality}
                      onChange={e => setConfidentiality(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="public">{t('batchScan.public')}</option>
                      <option value="internal">{t('batchScan.internal')}</option>
                      <option value="confidential">{t('batchScan.confidential')}</option>
                      <option value="restricted">{t('batchScan.restricted')}</option>
                      <option value="secret">{t('batchScan.secret')}</option>
                      <option value="top_secret">{t('batchScan.topSecret')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('batchScan.assignTo')}
                  </label>
                  <select
                    value={assignedUser}
                    onChange={e => setAssignedUser(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('batchScan.noAssignment')}</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {t('batchScan.tags')}
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('batchScan.tagsPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('batchScan.resolution')}
                    </label>
                    <select
                      value={resolution}
                      onChange={e => setResolution(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currentScannerDevice?.capabilities.supportedResolutions.map(res => (
                        <option key={res} value={res}>
                          {res} DPI
                        </option>
                      )) || (
                        <>
                          <option value={150}>150 DPI</option>
                          <option value={300}>300 DPI</option>
                          <option value={600}>600 DPI</option>
                          <option value={1200}>1200 DPI</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('batchScan.colorMode')}
                    </label>
                    <select
                      value={colorMode}
                      onChange={e =>
                        setColorMode(e.target.value as 'color' | 'grayscale' | 'blackwhite')
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="color">{t('batchScan.color')}</option>
                      <option value="grayscale">{t('batchScan.grayscale')}</option>
                      <option value="blackwhite">{t('batchScan.blackWhite')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {t('batchScan.advancedSettings')}
                  </button>

                  {showAdvancedSettings && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('batchScan.pageSize')}
                          </label>
                          <select
                            value={pageSize}
                            onChange={e =>
                              setPageSize(e.target.value as 'auto' | 'letter' | 'a4' | 'legal')
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="auto">{t('batchScan.autoDetect')}</option>
                            <option value="letter">Letter (8.5" x 11")</option>
                            <option value="a4">A4 (210mm x 297mm)</option>
                            <option value="legal">Legal (8.5" x 14")</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('batchScan.format')}
                          </label>
                          <select
                            value={scanFormat}
                            onChange={e =>
                              setScanFormat(e.target.value as 'pdf' | 'jpeg' | 'png' | 'tiff')
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pdf">PDF</option>
                            <option value="jpeg">JPEG</option>
                            <option value="png">PNG</option>
                            <option value="tiff">TIFF</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('batchScan.brightness')}: {brightness}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={brightness}
                            onChange={e => setBrightness(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('batchScan.contrast')}: {contrast}
                          </label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={contrast}
                            onChange={e => setContrast(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {currentScannerDevice?.capabilities.supportsDuplex && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={useDuplex}
                            onChange={e => setUseDuplex(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{t('batchScan.enableDuplex')}</span>
                        </label>
                      )}

                      {currentScannerDevice?.capabilities.supportsADF && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={useADF}
                            onChange={e => setUseADF(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{t('batchScan.enableADF')}</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={startSession}
                  disabled={!sessionName.trim() || !scannerReady}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <Save className="w-5 h-5" />
                  {t('batchScan.startSession')}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('batchScan.recentSessions')}</h2>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('batchScan.noSessions')}</p>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{session.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : session.status === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {session.status}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {session.scan_mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(session.created_at).toLocaleTimeString()}
                        </span>
                        {session.default_confidentiality && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            {session.default_confidentiality}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentSession?.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {scanMode === 'single' ? t('batchScan.singleModeActive') : t('batchScan.batchModeActive')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={completeSession}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {t('batchScan.complete')}
              </button>
              <button
                onClick={cancelSession}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                {t('batchScan.cancel')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={performScan}
                  disabled={scanningInProgress || !scannerReady}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {scanningInProgress ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {t('batchScan.scanning')}
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5" />
                      {t('batchScan.scanNow')}
                    </>
                  )}
                </button>

                <button
                  onClick={generatePreview}
                  disabled={scanningInProgress || !scannerReady}
                  className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  {t('batchScan.preview')}
                </button>
              </div>

              <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>{t('batchScan.resolution')}:</span>
                  <span className="font-medium">{resolution} DPI</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('batchScan.colorMode')}:</span>
                  <span className="font-medium">{colorMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('batchScan.format')}:</span>
                  <span className="font-medium uppercase">{scanFormat}</span>
                </div>
                {useDuplex && (
                  <div className="flex justify-between">
                    <span>{t('batchScan.duplex')}:</span>
                    <span className="font-medium text-green-600">{t('common.enabled')}</span>
                  </div>
                )}
                {useADF && (
                  <div className="flex justify-between">
                    <span>{t('batchScan.adf')}:</span>
                    <span className="font-medium text-green-600">{t('common.enabled')}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('batchScan.preview')}</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gray-50">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="max-h-full max-w-full" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">{t('batchScan.noPreview')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('batchScan.scannedDocuments')} ({scannedDocs.length})
            </h3>
            {scannedDocs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('batchScan.noDocuments')}</p>
            ) : (
              <div className="space-y-2">
                {scannedDocs.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-medium text-sm">
                        #{index + 1}
                      </div>
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.file_name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>
                            {doc.page_count} {t('batchScan.pages')}
                          </span>
                          <span>{doc.scan_resolution}</span>
                          <span>{doc.color_mode}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
