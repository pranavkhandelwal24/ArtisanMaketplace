import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Configure Cloudinary with your credentials from the .env.local file
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const body = (await request.json()) as { paramsToSign: Record<string, string> };
  const { paramsToSign } = body;

  try {
    // Securely generate the signature on the server
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);

    // Send the signature back to the client
    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Error signing Cloudinary params:', error);
    return NextResponse.json({ error: 'Failed to sign request' }, { status: 500 });
  }
}

