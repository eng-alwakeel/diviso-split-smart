import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportConfig {
  format: 'csv' | 'excel' | 'json';
  dataType: 'users' | 'groups' | 'expenses' | 'all';
  includeFields: string[];
  dateRange: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config, filters, users, groups, stats, businessMetrics } = await req.json();
    const exportConfig = config as ExportConfig;

    console.log('Export request:', { config: exportConfig, filters });

    let exportData: any = {};

    // Prepare data based on type
    switch (exportConfig.dataType) {
      case 'users':
        exportData = { users: users || [] };
        break;
      case 'groups':
        exportData = { groups: groups || [] };
        break;
      case 'all':
        exportData = {
          users: users || [],
          groups: groups || [],
          stats: stats || {},
          businessMetrics: businessMetrics || {}
        };
        break;
      default:
        exportData = { users: users || [] };
    }

    // Format based on export format
    let output: string;
    let contentType: string;

    switch (exportConfig.format) {
      case 'csv':
        output = convertToCSV(exportData, exportConfig.dataType);
        contentType = 'text/csv';
        break;
      case 'json':
        output = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        break;
      case 'excel':
        // For Excel, we'll return CSV format with Excel MIME type
        // In production, you'd use a library like SheetJS
        output = convertToCSV(exportData, exportConfig.dataType);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default:
        output = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
    }

    return new Response(output, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="admin-export-${Date.now()}.${exportConfig.format}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function convertToCSV(data: any, dataType: string): string {
  if (dataType === 'users' && data.users) {
    const headers = ['الاسم', 'الهاتف', 'الباقة', 'عدد المجموعات', 'عدد المصروفات', 'تاريخ التسجيل'];
    const rows = data.users.map((user: any) => [
      user.display_name || user.name || '',
      user.phone || '',
      user.current_plan || '',
      user.groups_count || 0,
      user.expenses_count || 0,
      new Date(user.created_at).toLocaleDateString('ar-SA')
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  if (dataType === 'groups' && data.groups) {
    const headers = ['اسم المجموعة', 'المالك', 'عدد الأعضاء', 'عدد المصروفات', 'المبلغ الإجمالي', 'تاريخ الإنشاء'];
    const rows = data.groups.map((group: any) => [
      group.name || '',
      group.owner_name || '',
      group.members_count || 0,
      group.expenses_count || 0,
      group.total_amount || 0,
      new Date(group.created_at).toLocaleDateString('ar-SA')
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  if (dataType === 'all') {
    let csv = '### المستخدمين ###\n';
    csv += convertToCSV({ users: data.users }, 'users');
    csv += '\n\n### المجموعات ###\n';
    csv += convertToCSV({ groups: data.groups }, 'groups');
    csv += '\n\n### الإحصائيات ###\n';
    csv += `إجمالي المستخدمين,${data.stats?.total_users || 0}\n`;
    csv += `إجمالي المجموعات,${data.stats?.total_groups || 0}\n`;
    csv += `إجمالي الإيرادات,${data.businessMetrics?.totalRevenue || 0}\n`;
    return csv;
  }

  return JSON.stringify(data, null, 2);
}
