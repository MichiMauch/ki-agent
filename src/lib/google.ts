import { google } from 'googleapis';

export async function getGoogleCalendarClientFromRefreshToken() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    'http://localhost:3000/api/auth/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  await oauth2Client.getAccessToken(); // aktualisiert den Token intern

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
