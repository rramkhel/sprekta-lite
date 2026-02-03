// Sprint 17.2: Today's Tasks API
import { createServiceClient } from '../../lib/supabase.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = req.headers['x-session-id'];
  const authHeader = req.headers.authorization;
  let userId = null;

  // Extract user ID from auth header if present
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (user) userId = user.id;
  }

  if (!sessionId && !userId) {
    return res.status(400).json({ error: 'Session or user ID required' });
  }

  try {
    const supabase = createServiceClient();

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Fetch todos for today
    let todosQuery = supabase
      .from('todos')
      .select('*')
      .or(`scheduled_date.eq.${todayStr},deadline.eq.${todayStr}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (userId) {
      todosQuery = todosQuery.eq('user_id', userId);
    } else {
      todosQuery = todosQuery.eq('session_id', sessionId);
    }

    const { data: todos, error: todosError } = await todosQuery;

    if (todosError) {
      console.error('[Today API] Todos error:', todosError);
      throw todosError;
    }

    // Fetch today's events (for anchor)
    let eventsQuery = supabase
      .from('events')
      .select('*')
      .eq('date', todayStr)
      .order('time', { ascending: true });

    if (userId) {
      eventsQuery = eventsQuery.eq('user_id', userId);
    } else {
      eventsQuery = eventsQuery.eq('session_id', sessionId);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('[Today API] Events error:', eventsError);
      throw eventsError;
    }

    // Group todos by context_group
    const groups = groupTodosByContext(todos || []);

    // Find anchor event (first event with time, prioritize flagged)
    const anchor = (events || []).find(e => e.time) || null;

    // Determine today's context from anchor or tasks
    const context = determineContext(anchor, todos || []);

    // Fetch tomorrow's data
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    // Fetch tomorrow's todos
    let tomorrowTodosQuery = supabase
      .from('todos')
      .select('*')
      .or(`scheduled_date.eq.${tomorrowStr},deadline.eq.${tomorrowStr}`);

    if (userId) {
      tomorrowTodosQuery = tomorrowTodosQuery.eq('user_id', userId);
    } else {
      tomorrowTodosQuery = tomorrowTodosQuery.eq('session_id', sessionId);
    }

    const { data: tomorrowTodos } = await tomorrowTodosQuery;

    // Fetch tomorrow's events
    let tomorrowEventsQuery = supabase
      .from('events')
      .select('*')
      .eq('date', tomorrowStr);

    if (userId) {
      tomorrowEventsQuery = tomorrowEventsQuery.eq('user_id', userId);
    } else {
      tomorrowEventsQuery = tomorrowEventsQuery.eq('session_id', sessionId);
    }

    const { data: tomorrowEvents } = await tomorrowEventsQuery;

    // Calculate tomorrow vibe
    const tomorrowVibe = calculateVibe(tomorrowTodos || [], tomorrowEvents || []);

    // Get flagged items from tomorrow
    const tomorrowFlagged = [
      ...(tomorrowTodos || []).filter(t => t.priority === 'non_negotiable'),
      ...(tomorrowEvents || []).filter(e => e.flagged)
    ];

    // Calculate totals across all time
    let allTodosQuery = supabase
      .from('todos')
      .select('id, completed, priority, scheduled_date, deadline');

    if (userId) {
      allTodosQuery = allTodosQuery.eq('user_id', userId);
    } else {
      allTodosQuery = allTodosQuery.eq('session_id', sessionId);
    }

    const { data: allTodos, count: totalTasks } = await allTodosQuery;

    const flaggedCount = (allTodos || []).filter(t => t.priority === 'non_negotiable').length;
    const orphanedCount = (allTodos || []).filter(t => !t.scheduled_date && !t.deadline && !t.completed).length;

    return res.status(200).json({
      today: {
        dayName: today.toLocaleDateString('en-US', { weekday: 'long' }),
        date: todayStr,
        context,
        groups,
        anchor,
        events: events || []
      },
      tomorrow: {
        dayName: tomorrowDate.toLocaleDateString('en-US', { weekday: 'long' }),
        date: tomorrowStr,
        vibe: tomorrowVibe,
        flagged: tomorrowFlagged,
        taskCount: (tomorrowTodos || []).length,
        eventCount: (tomorrowEvents || []).length
      },
      totals: {
        taskCount: (allTodos || []).length,
        flaggedCount,
        orphanedCount,
        allAccountedFor: orphanedCount === 0
      }
    });

  } catch (error) {
    console.error('[Today API] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch today data' });
  }
}

function groupTodosByContext(todos) {
  const groups = {};

  todos.forEach(todo => {
    const groupKey = todo.context_group || 'today';
    if (!groups[groupKey]) {
      groups[groupKey] = {
        key: groupKey,
        title: formatGroupTitle(groupKey, todo.context_label),
        subtitle: null,
        tasks: []
      };
    }
    groups[groupKey].tasks.push(todo);
  });

  // Sort groups by priority
  const groupOrder = [
    'due_today',
    'while_home',
    'at_office',
    'on_the_way',
    'before_anchor',
    'today',
    'flexible',
    'someday'
  ];

  return Object.values(groups).sort((a, b) => {
    const aIndex = groupOrder.indexOf(a.key);
    const bIndex = groupOrder.indexOf(b.key);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
}

function formatGroupTitle(key, contextLabel) {
  // Use context_label if available
  if (contextLabel) return contextLabel.toUpperCase();

  // Default titles
  const titles = {
    'due_today': 'DUE TODAY',
    'while_home': "WHILE YOU'RE HOME",
    'at_office': 'AT THE OFFICE',
    'on_the_way': 'ON THE WAY',
    'before_anchor': 'BEFORE',
    'today': 'TODAY',
    'flexible': 'FLEXIBLE',
    'someday': 'SOMEDAY'
  };
  return titles[key] || key.replace(/_/g, ' ').toUpperCase();
}

function determineContext(anchor, todos) {
  // Check if there's an anchor that suggests context
  if (anchor) {
    const title = anchor.title.toLowerCase();
    if (title.includes('birthday')) {
      const name = title.replace('birthday', '').replace('\'s', '').trim();
      return `${name}'s birthday`;
    }
    if (title.includes('dinner') || title.includes('home')) {
      return `you're at home for ${anchor.title.toLowerCase()}`;
    }
    if (title.includes('meeting') || title.includes('office')) {
      return `you're at the office`;
    }
  }

  // Check if todos suggest context
  const homeTask = todos.find(t => t.context_group === 'while_home');
  if (homeTask) {
    return "you're at home today";
  }

  const officeTask = todos.find(t => t.context_group === 'at_office');
  if (officeTask) {
    return "you're at the office today";
  }

  return null; // No specific context
}

function calculateVibe(todos, events) {
  const totalItems = todos.length + events.length;
  const flaggedCount = todos.filter(t => t.priority === 'non_negotiable').length +
                       events.filter(e => e.flagged).length;
  const deadlineCount = todos.filter(t => t.due_time).length;

  // Build vibe string
  const parts = [];

  if (totalItems === 0) {
    return 'clear day';
  }

  if (totalItems <= 3) {
    parts.push('light day');
  } else if (totalItems <= 6) {
    parts.push('moderate day');
  } else {
    parts.push('busy day');
  }

  if (flaggedCount > 0) {
    parts.push(`${flaggedCount} 🚩`);
  }

  if (deadlineCount > 0 && flaggedCount === 0) {
    parts.push(`${deadlineCount} deadline${deadlineCount > 1 ? 's' : ''}`);
  }

  return parts.join(' · ');
}
