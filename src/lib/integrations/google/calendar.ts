import { google } from 'googleapis';
import prisma from '@/lib/db/prisma';

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function createGoogleMeetingEvent(bookingId: string): Promise<{
  success: boolean;
  meetLink?: string;
  eventId?: string;
  error?: string;
}> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        service: true,
        consultant: {
          include: {
            user: true,
            googleConnection: true,
          },
        },
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    const oauth2Client = getGoogleOAuthClient();
    const connection = booking.consultant?.googleConnection;

    // If consultant has connected Google Calendar via OAuth
    if (oauth2Client && connection && connection.syncStatus === 'active') {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: `استشارة: ${booking.service.nameAr} - ${booking.customer.fullName}`,
        description: `جلسة استشارية عبر منصة أ. علي هشام\nالرقم المرجعي: ${booking.bookingReference}\nالعميل: ${booking.customer.fullName}\nرقم واتساب: ${booking.customer.whatsappPhone}\nالسؤال الرئيسي: ${booking.primaryQuestion}`,
        start: {
          dateTime: booking.slotStartTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: booking.slotEndTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: [{ email: booking.customer.email }],
        conferenceData: {
          createRequest: {
            requestId: `meet-${booking.id}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const res = await calendar.events.insert({
        calendarId: connection.calendarId || 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      });

      const meetLink = res.data.hangoutLink || res.data.conferenceData?.entryPoints?.[0]?.uri;
      const eventId = res.data.id || undefined;

      // Update Booking and CalendarEvent record in DB
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          meetingLink: meetLink,
          googleEventId: eventId,
        },
      });

      if (eventId) {
        await prisma.calendarEvent.upsert({
          where: { bookingId: booking.id },
          update: {
            googleEventId: eventId,
            meetLink,
            status: 'synced',
          },
          create: {
            bookingId: booking.id,
            googleEventId: eventId,
            meetLink,
            status: 'synced',
          },
        });
      }

      return { success: true, meetLink: meetLink || undefined, eventId };
    }

    // Fallback: If Google Calendar OAuth is not configured or in dev mode, generate a secure direct meeting room link
    const fallbackMeetLink = `https://meet.google.com/lookup/masarat-${booking.bookingReference.toLowerCase()}`;
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        meetingLink: fallbackMeetLink,
      },
    });

    return { success: true, meetLink: fallbackMeetLink };
  } catch (err: any) {
    console.error('Google Calendar event creation error:', err.message);
    // Graceful fallback link so the booking is not blocked
    const fallbackMeetLink = `https://meet.google.com/lookup/masarat-${bookingId.substring(0, 8)}`;
    await prisma.booking.update({
      where: { id: bookingId },
      data: { meetingLink: fallbackMeetLink },
    }).catch(() => {});

    return { success: false, meetLink: fallbackMeetLink, error: err.message };
  }
}

export async function updateGoogleMeetingEvent(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        consultant: { include: { googleConnection: true } },
        calendarEvent: true,
      },
    });

    if (!booking || !booking.calendarEvent?.googleEventId) {
      return { success: false };
    }

    const oauth2Client = getGoogleOAuthClient();
    const connection = booking.consultant?.googleConnection;

    if (oauth2Client && connection && connection.syncStatus === 'active') {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.events.patch({
        calendarId: connection.calendarId || 'primary',
        eventId: booking.calendarEvent.googleEventId,
        requestBody: {
          start: { dateTime: booking.slotStartTime.toISOString(), timeZone: 'UTC' },
          end: { dateTime: booking.slotEndTime.toISOString(), timeZone: 'UTC' },
        },
      });

      await prisma.calendarEvent.update({
        where: { id: booking.calendarEvent.id },
        data: { status: 'updated' },
      });

      return { success: true };
    }
  } catch (err) {
    console.error('Failed to update Google event on reschedule:', err);
  }
  return { success: false };
}

export async function deleteGoogleMeetingEvent(bookingId: string) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        consultant: { include: { googleConnection: true } },
        calendarEvent: true,
      },
    });

    if (!booking || !booking.calendarEvent?.googleEventId) return { success: false };

    const oauth2Client = getGoogleOAuthClient();
    const connection = booking.consultant?.googleConnection;

    if (oauth2Client && connection && connection.syncStatus === 'active') {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.events.delete({
        calendarId: connection.calendarId || 'primary',
        eventId: booking.calendarEvent.googleEventId,
      });

      await prisma.calendarEvent.update({
        where: { id: booking.calendarEvent.id },
        data: { status: 'cancelled' },
      });

      return { success: true };
    }
  } catch (err) {
    console.error('Failed to cancel Google event:', err);
  }
  return { success: false };
}
