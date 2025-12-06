import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { activityDb } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';

async function getDashboardActivity(request: NextRequest) {
  try {
    // Get recent activity logs
    const activityLogs = await activityDb.getRecent(10);

    // Transform activity logs into the format expected by the frontend
    const activities = activityLogs.map(log => {
      let type: 'rfp' | 'product' | 'partner' | 'user' = 'product';
      let title = log.action;
      let description = '';

      // Convert details object to string description if needed
      if (log.details) {
        if (typeof log.details === 'string') {
          description = log.details;
        } else if (typeof log.details === 'object') {
          // Handle different types of details objects
          if (log.details.files && Array.isArray(log.details.files)) {
            const fileCount = log.details.fileCount || log.details.files.length;
            const fileNames = log.details.files.map(f => f.name).join(', ');
            description = `Uploaded ${fileCount} file(s): ${fileNames}`;
          } else {
            description = JSON.stringify(log.details);
          }
        } else {
          description = String(log.details);
        }
      }

      // Determine activity type and format based on resource type and action
      switch (log.resourceType) {
        case 'product':
          type = 'product';
          if (log.action === 'created') {
            title = 'Product Created';
            if (!description) description = `New product added to catalog`;
          } else if (log.action === 'updated') {
            title = 'Product Updated';
            if (!description) description = `Product specifications modified`;
          } else if (log.action === 'upload') {
            title = 'File Upload';
            // Keep the file upload description we created above
          }
          break;
        case 'rfp':
        case 'rfp_request':
          type = 'rfp';
          if (log.action === 'created') {
            title = 'New RFP Request';
            if (!description) description = `RFP request submitted`;
          } else if (log.action === 'updated') {
            title = 'RFP Updated';
            if (!description) description = `RFP request status changed`;
          }
          break;
        case 'partner':
          type = 'partner';
          if (log.action === 'created') {
            title = 'New Partner Added';
            if (!description) description = `Partner registered in system`;
          } else if (log.action === 'updated') {
            title = 'Partner Updated';
            if (!description) description = `Partner information modified`;
          }
          break;
        case 'user':
          type = 'user';
          if (log.action === 'login') {
            title = 'User Login';
            if (!description) description = `User logged in`;
          } else if (log.action === 'created') {
            title = 'User Created';
            if (!description) description = `New user account created`;
          }
          break;
        default:
          type = 'product';
          title = log.action.charAt(0).toUpperCase() + log.action.slice(1);
          if (!description) description = 'Activity recorded';
      }

      return {
        id: log.id,
        type,
        title,
        description,
        time: formatDistanceToNow(log.created_at, { addSuffix: true }),
        status: getStatusFromAction(log.action),
        user: log.users ? `${log.users.first_name} ${log.users.last_name}` : 'System'
      };
    });

    return NextResponse.json({
      success: true,
      data: activities,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve dashboard activity',
        },
      },
      { status: 500 }
    );
  }
}

function getStatusFromAction(action: string): string {
  switch (action) {
    case 'created':
      return 'completed';
    case 'updated':
      return 'completed';
    case 'deleted':
      return 'completed';
    case 'login':
      return 'completed';
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    default:
      return 'completed';
  }
}

export const GET = withAuth(getDashboardActivity, {
  roles: ['ADMIN', 'admin', 'editor', 'viewer', 'user'],
});