export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing background appointment reminders & notifications scheduler...');

    // Run once after 5 seconds on startup
    setTimeout(async () => {
      try {
        const { processAppointmentReminders } = await import('@/lib/services/reminders');
        await processAppointmentReminders();
      } catch (err) {
        console.error('Initial reminder check error:', err);
      }
    }, 5000);

    // Run periodically every 60 seconds
    setInterval(async () => {
      try {
        const { processAppointmentReminders } = await import('@/lib/services/reminders');
        await processAppointmentReminders();
      } catch (err) {
        console.error('Periodic reminder worker error:', err);
      }
    }, 60 * 1000);
  }
}
