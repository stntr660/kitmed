import { NextRequest, NextResponse } from 'next/server';
import { 
  cleanupOrphanedFiles, 
  markOrphanedFiles, 
  getFileRegistryStats 
} from '@/lib/file-deduplication';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, olderThanDays = 7 } = body;

    switch (action) {
      case 'mark_orphaned':
        const marked = await markOrphanedFiles();
        return NextResponse.json({
          success: true,
          message: `Marked ${marked} files as orphaned`,
          markedCount: marked
        });

      case 'cleanup':
        const result = await cleanupOrphanedFiles(olderThanDays);
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${result.deleted} orphaned files`,
          deleted: result.deleted,
          errors: result.errors
        });

      case 'stats':
        const stats = await getFileRegistryStats();
        return NextResponse.json({
          success: true,
          stats
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: mark_orphaned, cleanup, or stats' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('File cleanup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform file cleanup operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await getFileRegistryStats();
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting file stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get file statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}