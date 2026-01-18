import React, { useEffect, useState } from 'react';
import { FileText, Activity, CheckSquare, TrendingUp, Clock, Edit3, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { RecentActivity, Task, File } from '../types';

type ActivityScope = 'my' | 'others' | 'everyone' | 'following';
type ItemType = 'all' | 'comments' | 'content' | 'memberships';
type TimeRange = 'today' | '7days' | '14days' | '28days';

export function Dashboard() {
  const { t } = useTranslation();
  const { currentDepartment, user } = useApp();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentActivity: 0,
    pendingTasks: 0,
    storageUsed: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [siteContentTab, setSiteContentTab] = useState<'modified' | 'editing'>('modified');
  const [recentlyModifiedFiles, setRecentlyModifiedFiles] = useState<File[]>([]);
  const [editingFiles, setEditingFiles] = useState<File[]>([]);
  const [activityScope, setActivityScope] = useState<ActivityScope>('my');
  const [itemType, setItemType] = useState<ItemType>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [showItemTypeDropdown, setShowItemTypeDropdown] = useState(false);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);

  useEffect(() => {
    if (currentDepartment) {
      loadDashboardData();
    }
  }, [currentDepartment]);

  useEffect(() => {
    if (currentDepartment) {
      loadActivities();
    }
  }, [currentDepartment, activityScope, itemType, timeRange]);

  const getTimeRangeDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeRange) {
      case 'today':
        return today.toISOString();
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '14days':
        return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      case '28days':
        return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const loadActivities = async () => {
    if (!currentDepartment || !user) return;

    const fromDate = getTimeRangeDate();
    let query = supabase
      .from('audit_log')
      .select('*, user:users!audit_log_user_id_fkey(full_name)')
      .eq('department_id', currentDepartment.id)
      .gte('created_at', fromDate)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityScope === 'my') {
      query = query.eq('user_id', user.id);
    } else if (activityScope === 'others') {
      query = query.neq('user_id', user.id);
    }

    if (itemType === 'content') {
      query = query.eq('entity_type', 'file');
    } else if (itemType === 'memberships') {
      query = query.in('action', ['user_added', 'user_removed', 'role_changed']);
    } else if (itemType === 'comments') {
      query = query.eq('entity_type', 'comment');
    }

    const { data: auditData } = await query;

    const formattedActivities: RecentActivity[] = (auditData || []).map((audit: any) => ({
      id: audit.id,
      user_id: audit.user_id,
      department_id: audit.department_id,
      activity_type: audit.action,
      entity_type: audit.entity_type,
      entity_id: audit.entity_id,
      entity_name: audit.details?.file_name || audit.entity_type,
      description: getActivityDescription(audit),
      created_at: audit.created_at,
    }));

    setActivities(formattedActivities);
  };

  const getActivityDescription = (audit: any) => {
    const userName = audit.user?.full_name || 'Unknown user';
    const action = audit.action;
    const entityType = audit.entity_type;
    const fileName = audit.details?.file_name || 'a document';

    switch (action) {
      case 'version_uploaded':
        return `${userName} uploaded version ${audit.details?.version_to} of ${fileName}`;
      case 'checked_out':
        return `${userName} checked out ${fileName}`;
      case 'checked_in':
        return `${userName} checked in ${fileName}`;
      case 'created':
        return `${userName} created ${entityType} ${fileName}`;
      case 'updated':
        return `${userName} updated ${entityType} ${fileName}`;
      case 'deleted':
        return `${userName} deleted ${entityType} ${fileName}`;
      default:
        return `${userName} performed ${action} on ${entityType}`;
    }
  };

  const loadDashboardData = async () => {
    if (!currentDepartment) return;

    const { data: allFiles } = await supabase
      .from('files')
      .select('file_size')
      .eq('department_id', currentDepartment.id);

    const { data: activityData } = await supabase
      .from('audit_log')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(5);

    const { data: modifiedFiles } = await supabase
      .from('files')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .order('modified_at', { ascending: false })
      .limit(5);

    const { data: filesInProgress } = await supabase
      .from('files')
      .select('*')
      .eq('department_id', currentDepartment.id)
      .in('status', ['draft', 'review'])
      .order('modified_at', { ascending: false })
      .limit(5);

    const totalStorage = allFiles?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0;

    setTasks(taskData || []);
    setRecentlyModifiedFiles(modifiedFiles || []);
    setEditingFiles(filesInProgress || []);
    setStats({
      totalDocuments: allFiles?.length || 0,
      recentActivity: activityData?.length || 0,
      pendingTasks: taskData?.length || 0,
      storageUsed: Math.round(totalStorage / (1024 * 1024)),
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(type)) return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (['xlsx', 'xls', 'csv'].includes(type)) return { bg: 'bg-green-100', text: 'text-green-600' };
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(type)) return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
    if (['mp4', 'avi', 'mov'].includes(type)) return { bg: 'bg-purple-100', text: 'text-purple-600' };
    return { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const statCards = [
    {
      titleKey: 'dashboard.totalDocuments',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'bg-emerald-500',
      trend: '+12%',
    },
    {
      titleKey: 'dashboard.recentActivity',
      value: stats.recentActivity,
      icon: Activity,
      color: 'bg-blue-500',
      trend: '+5%',
    },
    {
      titleKey: 'dashboard.pendingTasks',
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: 'bg-amber-500',
      trend: '-3%',
    },
    {
      titleKey: 'dashboard.storageUsed',
      value: `${stats.storageUsed} MB`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: '+8%',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.welcome', { department: currentDepartment?.name })}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.titleKey} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{card.trend}</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{t(card.titleKey)}</h3>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Site Content</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSiteContentTab('modified')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    siteContentTab === 'modified'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  I Recently Modified
                </button>
                <button
                  onClick={() => setSiteContentTab('editing')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    siteContentTab === 'editing'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  I'm Editing
                </button>
              </div>
            </div>

            <div className="p-6">
              {siteContentTab === 'modified' ? (
                recentlyModifiedFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No recently modified files</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentlyModifiedFiles.map((file) => {
                      const colors = getFileTypeColor(file.file_type);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                        >
                          <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <FileText className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              Modified {formatDate(file.modified_at)} • {formatFileSize(file.file_size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              file.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              file.status === 'review' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {file.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                editingFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No files currently being edited</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editingFiles.map((file) => {
                      const colors = getFileTypeColor(file.file_type);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                        >
                          <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <FileText className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              Last modified {formatDate(file.modified_at)} • {formatFileSize(file.file_size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                              file.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              <Edit3 className="w-3 h-3" />
                              {file.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 mb-3">My Activities</h2>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowScopeDropdown(!showScopeDropdown);
                      setShowItemTypeDropdown(false);
                      setShowTimeRangeDropdown(false);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                  >
                    {activityScope === 'my' && "My activities"}
                    {activityScope === 'others' && "Everyone else's activities"}
                    {activityScope === 'everyone' && "Everyone's activities"}
                    {activityScope === 'following' && "I'm following"}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showScopeDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => { setActivityScope('my'); setShowScopeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        My activities
                      </button>
                      <button
                        onClick={() => { setActivityScope('others'); setShowScopeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        Everyone else's activities
                      </button>
                      <button
                        onClick={() => { setActivityScope('everyone'); setShowScopeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        Everyone's activities
                      </button>
                      <button
                        onClick={() => { setActivityScope('following'); setShowScopeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        I'm following
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowItemTypeDropdown(!showItemTypeDropdown);
                      setShowScopeDropdown(false);
                      setShowTimeRangeDropdown(false);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                  >
                    {itemType === 'all' && "all items"}
                    {itemType === 'comments' && "comments"}
                    {itemType === 'content' && "content"}
                    {itemType === 'memberships' && "memberships"}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showItemTypeDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => { setItemType('all'); setShowItemTypeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        all items
                      </button>
                      <button
                        onClick={() => { setItemType('comments'); setShowItemTypeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        comments
                      </button>
                      <button
                        onClick={() => { setItemType('content'); setShowItemTypeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        content
                      </button>
                      <button
                        onClick={() => { setItemType('memberships'); setShowItemTypeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        memberships
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowTimeRangeDropdown(!showTimeRangeDropdown);
                      setShowScopeDropdown(false);
                      setShowItemTypeDropdown(false);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                  >
                    {timeRange === 'today' && "today"}
                    {timeRange === '7days' && "in the last 7 days"}
                    {timeRange === '14days' && "in the last 14 days"}
                    {timeRange === '28days' && "in the last 28 days"}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showTimeRangeDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => { setTimeRange('today'); setShowTimeRangeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        today
                      </button>
                      <button
                        onClick={() => { setTimeRange('7days'); setShowTimeRangeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        in the last 7 days
                      </button>
                      <button
                        onClick={() => { setTimeRange('14days'); setShowTimeRangeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-200"
                      >
                        in the last 14 days
                      </button>
                      <button
                        onClick={() => { setTimeRange('28days'); setShowTimeRangeDropdown(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        in the last 28 days
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No activities found</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t('dashboard.pendingTasks')}</h2>
              <CheckSquare className="w-5 h-5 text-gray-400" />
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">{t('dashboard.noTasks')}</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        Due {formatDate(task.due_date)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
