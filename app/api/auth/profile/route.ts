import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  userId: number;
  [key: string]: any;
};

// Helper function to create a response with CORS headers
const createResponse = (data: any, status: number = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
};

// Helper to extract token from request
const getAuthToken = (request: Request, cookieStore: any): string | null => {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('[Profile API] Found token in Authorization header');
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  // Fall back to cookies
  const cookieToken = cookieStore.get('auth-token')?.value;
  if (cookieToken) {
    console.log('[Profile API] Found token in cookies');
    return cookieToken;
  }
  
  return null;
};

export async function OPTIONS() {
  return createResponse({}, 204);
}

export async function PUT(request: Request) {
  try {
    console.log('[Profile API] Received profile update request');
    
    // Get the auth token from either header or cookies
    const cookieStore = await cookies();
    const token = getAuthToken(request, cookieStore);
    
    console.log('[Profile API] Auth token found:', !!token);
    
    if (!token) {
      console.error('[Profile API] No auth token found in headers or cookies');
      return createResponse({ 
        error: 'Unauthorized: No authentication token provided',
        details: 'Please log in and try again.'
      }, 401);
    }

    // Verify the JWT token
    let userId: number | null = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
      userId = decoded.userId;
      console.log('[Profile API] Successfully decoded token for user ID:', userId);
    } catch (jwtError) {
      console.error('[Profile API] JWT verification failed:', jwtError);
      return createResponse({ 
        error: 'Invalid or expired token',
        details: 'Your session may have expired. Please log in again.'
      }, 401);
    }

    if (!userId) {
      console.error('[Profile API] No user ID in token');
      return createResponse({ error: 'Invalid token: No user ID' }, 401);
    }

    // Parse the request body
    let profileData;
    try {
      const requestClone = request.clone(); // Clone the request for potential re-reading
      try {
        profileData = await requestClone.json();
        console.log('[Profile API] Successfully parsed profile data');
      } catch (parseError) {
        console.error('[Profile API] Error parsing JSON body:', parseError);
        // Try to read as text for debugging
        const textBody = await requestClone.text();
        console.error('[Profile API] Request body as text:', textBody);
        return createResponse({ 
          error: 'Invalid request body',
          details: 'The request body must be valid JSON.'
        }, 400);
      }
      
      console.log('[Profile API] Received profile data for user ID:', userId);
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Profile API] Profile data:', JSON.stringify(profileData, null, 2));
      }
    } catch (error) {
      console.error('[Profile API] Unexpected error processing request body:', error);
      return createResponse({ 
        error: 'Error processing request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }

    try {
      // Here you would typically update the user's profile in your database
      // For example:
      // const updatedUser = await prisma.user.update({
      //   where: { id: userId },
      //   data: {
      //     ...profileData,
      //     updatedAt: new Date()
      //   },
      //   select: { id: true, name: true, email: true } // Only return necessary fields
      // });

      // For now, we'll just return a success response with the data we received
      const responseData = {
        success: true,
        user: {
          id: userId,
          ...profileData
        },
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString()
      };

      console.log(`[Profile API] Successfully processed profile update for user ID: ${userId}`);
      return createResponse(responseData);
      
    } catch (dbError) {
      console.error('[Profile API] Database error:', dbError);
      return createResponse({
        error: 'Failed to update profile in database',
        details: process.env.NODE_ENV === 'development' ? 
          (dbError instanceof Error ? dbError.message : 'Unknown database error') :
          'Please try again later.'
      }, 500);
    }

  } catch (error) {
    console.error('[Profile API] Unexpected error:', error);
    return createResponse({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}
