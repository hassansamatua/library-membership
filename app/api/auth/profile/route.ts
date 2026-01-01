import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

// Configure the upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DOCUMENT_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');
fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });

async function getAuthToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (authToken) return authToken;

  try {
    const cookieStore = await cookies();
    return cookieStore.get('token')?.value || null;
  } catch {
    const cookieHeader = request.headers.get('cookie');
    return cookieHeader
      ? cookieHeader
          .split('; ')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1] || null
      : null;
  }
}

const parseJsonValue = (value: unknown) => {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const safeJsonParse = (raw: FormDataEntryValue | null) => {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
};

const normalizeProfile = (row: any) => {
  const personalInfoJson = parseJsonValue(row.personal_info) as any;
  const contactInfoJson = parseJsonValue(row.contact_info) as any;
  const educationJson = parseJsonValue(row.education) as any;
  const employmentJson = parseJsonValue(row.employment) as any;
  const membershipInfoJson = parseJsonValue(row.membership_info) as any;

  const membershipFromInfo = membershipInfoJson?.membership || {};
  const paymentFromInfo = membershipInfoJson?.payment || {};
  const participationFromInfo = membershipInfoJson?.participation || {};
  const documentsFromInfo = membershipInfoJson?.documents || {};

  const degreeCertificates = row.degree_certificates_path
    ? (parseJsonValue(row.degree_certificates_path) || row.degree_certificates_path)
    : (documentsFromInfo?.degreeCertificates || documentsFromInfo?.degree_certificates || null);

  return {
    personalInfo: {
      fullName: personalInfoJson?.fullName || personalInfoJson?.name || row.full_name || row.name || '',
      dateOfBirth: row.date_of_birth || personalInfoJson?.dateOfBirth || personalInfoJson?.date_of_birth || '',
      gender: row.gender || personalInfoJson?.gender || '',
      placeOfBirth: row.place_of_birth || personalInfoJson?.placeOfBirth || personalInfoJson?.place_of_birth || '',
      profilePicture: row.profile_picture || personalInfoJson?.profilePicture || personalInfoJson?.profile_picture || null,
      nationality: row.nationality || personalInfoJson?.nationality || '',
      idNumber: row.id_number || personalInfoJson?.idNumber || personalInfoJson?.id_number || ''
    },
    contactInfo: {
      email: row.email || '',
      phone: row.phone || contactInfoJson?.phone || '',
      address: row.address || contactInfoJson?.address || '',
      city: row.city || contactInfoJson?.city || '',
      country: row.country || contactInfoJson?.country || '',
      postalCode: row.postal_code || contactInfoJson?.postalCode || contactInfoJson?.postal_code || ''
    },
    professionalInfo: {
      occupation: row.job_title || row.current_position || employmentJson?.occupation || employmentJson?.jobTitle || '',
      company: row.employer_organization || row.industry || employmentJson?.company || '',
      yearsOfExperience: String(row.years_experience ?? row.years_of_experience ?? employmentJson?.yearsOfExperience ?? ''),
      specialization: employmentJson?.specialization || '',
      skills: row.skills
        ? String(row.skills).split(',').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(employmentJson?.skills) ? employmentJson.skills : [])
    },
    education: Array.isArray(educationJson) ? educationJson : [],
    membership: {
      membershipType: row.membership_type || membershipFromInfo?.membershipType || membershipFromInfo?.membership_type || '',
      membershipNumber: row.membership_number || membershipFromInfo?.membershipNumber || membershipFromInfo?.membership_number || '',
      membershipStatus: row.membership_status || membershipFromInfo?.membershipStatus || membershipFromInfo?.membership_status || '',
      joinDate: row.join_date || membershipFromInfo?.joinDate || membershipFromInfo?.join_date || ''
    },
    payment: {
      paymentMethod: paymentFromInfo?.paymentMethod || paymentFromInfo?.payment_method || paymentFromInfo?.method || ''
    },
    participation: {
      previousEvents: participationFromInfo?.previousEvents || participationFromInfo?.previous_events || [],
      areasOfInterest: participationFromInfo?.areasOfInterest || participationFromInfo?.areas_of_interest || [],
      volunteerInterest: toBoolean(participationFromInfo?.volunteerInterest ?? participationFromInfo?.volunteer_interest)
    },
    documents: {
      idProof: row.id_proof_path || documentsFromInfo?.idProof || documentsFromInfo?.id_proof || null,
      degreeCertificates,
      cv: row.cv_path || documentsFromInfo?.cv || null
    }
  };
};

async function updateProfileWithFormData(connection: PoolConnection, decodedId: number, formData: FormData) {
  const personalInfo = safeJsonParse(formData.get('personalInfo')) || {};
  const contactInfo = safeJsonParse(formData.get('contactInfo')) || null;
  const professionalInfo = safeJsonParse(formData.get('professionalInfo')) || null;
  const education = safeJsonParse(formData.get('education')) || null;
  const membership = safeJsonParse(formData.get('membership')) || null;
  const payment = safeJsonParse(formData.get('payment')) || null;
  const participation = safeJsonParse(formData.get('participation')) || null;

  const profilePicture = formData.get('profilePicture') as File | null;
  const profilePictureUrl = formData.get('profilePictureUrl') as string | null;

  const idProof = formData.get('idProof') as File | null;
  const cv = formData.get('cv') as File | null;
  const degreeCertificates = formData.getAll('degreeCertificates') as File[];

  const profileUpdate: Record<string, any> = {};

  profileUpdate.personal_info = JSON.stringify(personalInfo);
  if (contactInfo) profileUpdate.contact_info = JSON.stringify(contactInfo);
  if (professionalInfo) profileUpdate.employment = JSON.stringify(professionalInfo);
  if (education) profileUpdate.education = JSON.stringify(education);

  if (membership || payment || participation) {
    profileUpdate.membership_info = JSON.stringify({
      ...(membership ? { membership } : {}),
      ...(payment ? { payment } : {}),
      ...(participation ? { participation } : {})
    });
  }

  const dob = (personalInfo as any).date_of_birth || (personalInfo as any).dateOfBirth || null;
  const gender = (personalInfo as any).gender || null;
  const idNumber = (personalInfo as any).id_number || (personalInfo as any).idNumber || null;
  const nationality = (personalInfo as any).nationality || null;
  const placeOfBirth = (personalInfo as any).place_of_birth || (personalInfo as any).placeOfBirth || null;
  const phone = (personalInfo as any).phone || (contactInfo as any)?.phone || null;
  const address = (personalInfo as any).address || (contactInfo as any)?.address || null;
  const city = (personalInfo as any).city || (contactInfo as any)?.city || null;
  const country = (personalInfo as any).country || (contactInfo as any)?.country || null;
  const postalCode = (personalInfo as any).postal_code || (personalInfo as any).postalCode || (contactInfo as any)?.postalCode || null;

  if (dob) profileUpdate.date_of_birth = dob;
  if (gender) profileUpdate.gender = gender;
  if (idNumber) profileUpdate.id_number = idNumber;
  if (nationality) profileUpdate.nationality = nationality;
  if (placeOfBirth) profileUpdate.place_of_birth = placeOfBirth;
  if (phone) profileUpdate.phone = phone;
  if (address) profileUpdate.address = address;
  if (city) profileUpdate.city = city;
  if (country) profileUpdate.country = country;
  if (postalCode) profileUpdate.postal_code = postalCode;

  if (membership) {
    const membershipType = (membership as any).membershipType || (membership as any).membership_type || null;
    const membershipNumber = (membership as any).membershipNumber || (membership as any).membership_number || null;
    const membershipStatus = (membership as any).membershipStatus || (membership as any).membership_status || null;
    const joinDate = (membership as any).joinDate || (membership as any).join_date || null;
    if (membershipType) profileUpdate.membership_type = membershipType;
    if (membershipNumber) profileUpdate.membership_number = membershipNumber;
    if (membershipStatus) profileUpdate.membership_status = membershipStatus;
    if (joinDate) profileUpdate.join_date = joinDate;
  }

  if (profilePicture && profilePicture.size > 0) {
    const fileExtension = profilePicture.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const bytes = await profilePicture.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer);
    profileUpdate.profile_picture = `/uploads/profile-pictures/${fileName}`;
  } else if (profilePictureUrl) {
    if (profilePictureUrl.startsWith('data:image/')) {
      const match = profilePictureUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json(
          { success: false, message: 'Invalid profile picture format' },
          { status: 400 }
        );
      }
      const mimeType = match[1];
      const base64Data = match[2];
      const extension = mimeType.split('/')[1] || 'png';
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.promises.writeFile(filePath, buffer);
      profileUpdate.profile_picture = `/uploads/profile-pictures/${fileName}`;
    } else {
      profileUpdate.profile_picture = profilePictureUrl;
    }
  }

  if (idProof && idProof.size > 0) {
    const fileExtension = idProof.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(DOCUMENT_UPLOAD_DIR, fileName);
    const bytes = await idProof.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer);
    profileUpdate.id_proof_path = `/uploads/documents/${fileName}`;
  }

  if (cv && cv.size > 0) {
    const fileExtension = cv.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(DOCUMENT_UPLOAD_DIR, fileName);
    const bytes = await cv.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.promises.writeFile(filePath, buffer);
    profileUpdate.cv_path = `/uploads/documents/${fileName}`;
  }

  if (degreeCertificates && degreeCertificates.length > 0) {
    const uploaded: string[] = [];
    for (const cert of degreeCertificates) {
      if (!cert || cert.size === 0) continue;
      const fileExtension = cert.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = path.join(DOCUMENT_UPLOAD_DIR, fileName);
      const bytes = await cert.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.promises.writeFile(filePath, buffer);
      uploaded.push(`/uploads/documents/${fileName}`);
    }
    if (uploaded.length > 0) {
      profileUpdate.degree_certificates_path = JSON.stringify(uploaded);
    }
  }

  await connection.beginTransaction();
  try {
    const [existingProfile] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [decodedId]
    );

    if (existingProfile?.length > 0) {
      const updateFields = Object.keys(profileUpdate);
      const updateValues = Object.values(profileUpdate);
      const setClause = updateFields.map(field => `\`${field}\` = ?`).join(', ');

      await connection.query(
        `UPDATE user_profiles SET ${setClause} WHERE user_id = ?`,
        [...updateValues, decodedId]
      );
    } else {
      const insertFields = ['user_id', ...Object.keys(profileUpdate)];
      const insertValues = [decodedId, ...Object.values(profileUpdate)];
      const placeholders = insertFields.map(() => '?').join(', ');
      const columns = insertFields.map(field => `\`${field}\``).join(', ');

      await connection.query(
        `INSERT INTO user_profiles (${columns}) VALUES (${placeholders})`,
        insertValues
      );
    }

    await connection.commit();

    const [users] = await connection.query<RowDataPacket[]>(
      `SELECT 
        u.*, 
        up.* 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?`,
      [decodedId]
    );

    const updatedUser = users[0];
    if (updatedUser) {
      delete updatedUser.password;
      delete updatedUser.refresh_token;
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: toBoolean(updatedUser.is_admin),
        isApproved: toBoolean(updatedUser.is_approved),
        membershipNumber: updatedUser.membership_number || updatedUser.membershipNumber || null,
        profile: normalizeProfile(updatedUser)
      }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

// GET endpoint to fetch user profile
export async function GET(request: Request) {
  const connection = (await pool.getConnection()) as PoolConnection;

  try {
    const token = await getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch user data with profile
    const [users] = await connection.query<RowDataPacket[]>(
      `SELECT 
        u.*, 
        up.* 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?`,
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    
    // Clean up sensitive data
    delete user.password;
    delete user.refresh_token;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: toBoolean(user.is_admin),
        isApproved: toBoolean(user.is_approved),
        membershipNumber: user.membership_number || user.membershipNumber || null,
        profile: normalizeProfile(user)
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/auth/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT endpoint to update user profile
export async function PUT(request: Request) {
  const connection = (await pool.getConnection()) as PoolConnection;
  
  try {
    const token = await getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      return await updateProfileWithFormData(connection, decoded.id, formData);
    }

    const body = await request.json().catch(() => ({}));
    const formData = new FormData();
    if (body?.personalInfo) formData.set('personalInfo', JSON.stringify(body.personalInfo));
    if (body?.contactInfo) formData.set('contactInfo', JSON.stringify(body.contactInfo));
    if (body?.professionalInfo) formData.set('professionalInfo', JSON.stringify(body.professionalInfo));
    if (body?.education) formData.set('education', JSON.stringify(body.education));
    if (body?.membership) formData.set('membership', JSON.stringify(body.membership));
    if (body?.payment) formData.set('payment', JSON.stringify(body.payment));
    if (body?.participation) formData.set('participation', JSON.stringify(body.participation));

    return await updateProfileWithFormData(connection, decoded.id, formData);
  } catch (error: unknown) {
    console.error('Error in PUT /api/auth/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        })
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PATCH endpoint to update user profile with file upload
export async function PATCH(request: Request) {
  const connection = (await pool.getConnection()) as PoolConnection;
  
  try {
    const token = await getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    return await updateProfileWithFormData(connection, decoded.id, formData);
  } catch (error) {
    console.error('Error in PATCH /api/auth/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: (error as Error).message })
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}