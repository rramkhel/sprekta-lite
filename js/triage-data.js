/**
 * Triage Data
 *
 * Fetches events organized into triage buckets.
 */

const TriageData = {
  /**
   * Fetch all triage buckets
   */
  async fetchAll() {
    const events = await this.fetchEvents();
    return this.organize(events);
  },

  /**
   * Fetch user's events
   */
  async fetchEvents() {
    try {
      const response = await fetch('/api/events');

      if (!response.ok) {
        console.error('Failed to fetch events:', response.statusText);
        return [];
      }

      const data = await response.json();
      return data.events || [];
    } catch (e) {
      console.error('Failed to fetch events:', e);
      return [];
    }
  },

  /**
   * Organize events into buckets
   */
  organize(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const buckets = {
      today: [],
      thisWeek: [],
      later: [],
      undetermined: []
    };

    for (const event of events) {
      // Undetermined: no date or flagged as needs triage
      if (!event.date || event.needsTriage) {
        buckets.undetermined.push(event);
        continue;
      }

      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      // Skip past events (only show today and future)
      if (eventDate < today) {
        continue;
      }

      // Today
      if (eventDate.getTime() === today.getTime()) {
        buckets.today.push(event);
      }
      // This week (not today)
      else if (eventDate > today && eventDate <= endOfWeek) {
        buckets.thisWeek.push(event);
      }
      // Later
      else if (eventDate > endOfWeek) {
        buckets.later.push(event);
      }
    }

    // Sort each bucket by date/time
    buckets.today.sort((a, b) => this.compareTime(a.time, b.time));
    buckets.thisWeek.sort((a, b) => this.compareDate(a.date, b.date));
    buckets.later.sort((a, b) => this.compareDate(a.date, b.date));

    return buckets;
  },

  /**
   * Compare times for sorting
   */
  compareTime(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  },

  /**
   * Compare dates for sorting
   */
  compareDate(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return new Date(a) - new Date(b);
  }
};

export default TriageData;
