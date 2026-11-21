/**
 * DDCET RankRise - Daily Study Streaks Service
 * Duolingo-style streak tracking engine for students.
 * Timezone: Asia/Kolkata (UTC+5:30)
 */

const db = require('./db-adapter');

const KOLKATA_TIMEZONE = 'Asia/Kolkata';

// Milestone definitions
const STREAK_MILESTONES = [
  { days: 3, id: 'streak_3', title: '3-Day Spark', icon: '🔥', description: 'Completed 3 consecutive study days! Great momentum!' },
  { days: 7, id: 'streak_7', title: '7-Day Warrior', icon: '⚡', description: 'A full week of non-stop learning! True dedication.' },
  { days: 14, id: 'streak_14', title: 'Fortnight Focus', icon: '🎯', description: '14 days of relentless preparation for DDCET!' },
  { days: 30, id: 'streak_30', title: 'Monthly Master', icon: '🏆', description: '30-day streak! You are among the most disciplined students.' },
  { days: 50, id: 'streak_50', title: '50-Day Dedication', icon: '🌟', description: '50 consecutive study days! Mastery is within reach.' },
  { days: 100, id: 'streak_100', title: 'Centurion Scholar', icon: '👑', description: '100 days of legendary academic commitment!' }
];

/**
 * Returns YYYY-MM-DD string in Asia/Kolkata timezone
 */
function getKolkataDateString(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KOLKATA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Converts YYYY-MM-DD string to UTC midnight timestamp for exact calendar math
 */
function parseKolkataDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 0;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return Date.UTC(y, m - 1, d);
}

/**
 * Exact calendar day difference between two YYYY-MM-DD dates (B - A)
 */
function daysBetween(dateStrA, dateStrB) {
  const utcA = parseKolkataDate(dateStrA);
  const utcB = parseKolkataDate(dateStrB);
  return Math.round((utcB - utcA) / (24 * 60 * 60 * 1000));
}

/**
 * Returns previous calendar day string YYYY-MM-DD
 */
function getYesterdayKolkata(dateStr) {
  const utc = parseKolkataDate(dateStr);
  const prev = new Date(utc - 24 * 60 * 60 * 1000);
  return prev.toISOString().split('T')[0];
}

/**
 * Returns next calendar day string YYYY-MM-DD
 */
function getTomorrowKolkata(dateStr) {
  const utc = parseKolkataDate(dateStr);
  const next = new Date(utc + 24 * 60 * 60 * 1000);
  return next.toISOString().split('T')[0];
}

/**
 * Pure calculation function for streaks from a list of active YYYY-MM-DD dates
 */
function calculateStreakFromDates(datesArray = [], todayStr, permanentLongest = 0) {
  const uniqueDates = Array.from(new Set(datesArray.filter(Boolean))).sort();
  const activeSet = new Set(uniqueDates);

  if (uniqueDates.length === 0) {
    return {
      current_streak: 0,
      longest_streak: Math.max(0, parseInt(permanentLongest) || 0),
      studied_today: false,
      studied_yesterday: false,
      total_active_days: 0,
      active_dates: []
    };
  }

  // 1. Calculate max historical contiguous streak
  let maxHistoricalStreak = 1;
  let runningChain = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const diff = daysBetween(uniqueDates[i - 1], uniqueDates[i]);
    if (diff === 1) {
      runningChain++;
      if (runningChain > maxHistoricalStreak) {
        maxHistoricalStreak = runningChain;
      }
    } else if (diff > 1) {
      runningChain = 1;
    }
  }

  const today = todayStr || getKolkataDateString();
  const yesterday = getYesterdayKolkata(today);

  const studied_today = activeSet.has(today);
  const studied_yesterday = activeSet.has(yesterday);

  // 2. Calculate current streak
  let current_streak = 0;

  if (studied_today) {
    current_streak = 1;
    let checkDate = yesterday;
    while (activeSet.has(checkDate)) {
      current_streak++;
      checkDate = getYesterdayKolkata(checkDate);
    }
  } else if (studied_yesterday) {
    // Student studied yesterday, but has not studied yet today.
    // Streak is intact/alive, awaiting today's study activity!
    current_streak = 1;
    let checkDate = getYesterdayKolkata(yesterday);
    while (activeSet.has(checkDate)) {
      current_streak++;
      checkDate = getYesterdayKolkata(checkDate);
    }
  } else {
    // Missed at least one full calendar day (yesterday was missed)
    current_streak = 0;
  }

  const longest_streak = Math.max(
    parseInt(permanentLongest) || 0,
    maxHistoricalStreak,
    current_streak
  );

  return {
    current_streak,
    longest_streak,
    studied_today,
    studied_yesterday,
    total_active_days: uniqueDates.length,
    active_dates: uniqueDates
  };
}

/**
 * Generates Monday through Sunday dates for the current week in Asia/Kolkata
 */
function getWeeklyActivityIndicator(activeDatesSet, todayStr) {
  const today = todayStr || getKolkataDateString();
  const todayUtc = parseKolkataDate(today);
  const d = new Date(todayUtc);
  
  // getDay(): 0 is Sun, 1 is Mon, ..., 6 is Sat
  const dayOfWeek = d.getUTCDay();
  // We want Monday as index 0, Sunday as index 6
  const mondayOffset = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);

  const daysLabels = [
    { key: 'Mon', label: 'M' },
    { key: 'Tue', label: 'T' },
    { key: 'Wed', label: 'W' },
    { key: 'Thu', label: 'T' },
    { key: 'Fri', label: 'F' },
    { key: 'Sat', label: 'S' },
    { key: 'Sun', label: 'S' }
  ];

  const week = [];

  for (let i = 0; i < 7; i++) {
    const dayOffset = mondayOffset + i;
    const dayUtc = new Date(todayUtc + dayOffset * 24 * 60 * 60 * 1000);
    const dateString = dayUtc.toISOString().split('T')[0];
    const isToday = dateString === today;
    const isPast = dateString < today;
    const isFuture = dateString > today;
    const completed = activeDatesSet.has(dateString);

    week.push({
      date: dateString,
      day_name: daysLabels[i].key,
      day_letter: daysLabels[i].label,
      is_today: isToday,
      is_past: isPast,
      is_future: isFuture,
      completed
    });
  }

  return week;
}

/**
 * Synchronize existing student attempts into student_study_days if not already present
 * (Safe historical backfill so past student learning is recognized)
 */
async function syncExistingAttemptsToStudyDays(userId) {
  if (!userId) return;

  try {
    let attempts = [];
    try {
      attempts = await db.find('student_attempts', { user_id: userId });
    } catch (_e) {
      const all = await db.getAll('student_attempts');
      attempts = all.filter(a => String(a.user_id) === String(userId));
    }

    if (!Array.isArray(attempts) || attempts.length === 0) return;

    // Get existing recorded study days
    let existingDays = [];
    try {
      existingDays = await db.find('student_study_days', { user_id: userId });
    } catch (_e) {
      const all = await db.getAll('student_study_days');
      existingDays = all.filter(d => String(d.user_id) === String(userId));
    }

    const recordedDates = new Set(existingDays.map(d => d.study_date));

    // Aggregate attempts by date
    const dateMap = new Map();
    for (const a of attempts) {
      const dateStr = getKolkataDateString(a.submitted_at);
      if (!dateStr) continue;

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { count: 0, time: 0, questions: 0 });
      }
      const entry = dateMap.get(dateStr);
      entry.count += 1;
      
      let answersObj = a.answers;
      while (typeof answersObj === 'string') {
        try { answersObj = JSON.parse(answersObj); } catch (e) { break; }
      }
      const qCount = parseInt(a.questions_attempted) || (answersObj?.answers ? Object.keys(answersObj.answers).length : 0);
      const tSpent = parseInt(a.time_spent_seconds) || 0;
      entry.questions += qCount;
      entry.time += tSpent;
    }

    for (const [dateStr, stats] of dateMap.entries()) {
      if (!recordedDates.has(dateStr)) {
        await db.insert('student_study_days', {
          user_id: userId,
          study_date: dateStr,
          activities_count: stats.count,
          total_time_seconds: stats.time,
          total_questions: stats.questions,
          last_activity_type: 'test',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.warn(`[Streak Sync Warning] Failed to backfill attempts for user ${userId}:`, err.message);
  }
}

/**
 * Record a completed learning activity for a student
 * Multiple activities on the same day count as ONE streak day.
 */
async function recordStudyActivity({ userId, timeSpentSeconds = 0, questionsAttempted = 0, activityType = 'practice' }) {
  if (!userId) throw new Error('userId is required to record study activity');

  const todayStr = getKolkataDateString();
  const nowIso = new Date().toISOString();

  // 1. Check or insert into student_study_days
  let existingDay = null;
  try {
    existingDay = await db.findOne('student_study_days', { user_id: userId, study_date: todayStr });
  } catch (_e) {
    const all = await db.getAll('student_study_days');
    existingDay = all.find(d => String(d.user_id) === String(userId) && d.study_date === todayStr);
  }

  if (existingDay) {
    // Already studied today! Update counts, do NOT duplicate day record
    await db.update('student_study_days', existingDay.id, {
      activities_count: (parseInt(existingDay.activities_count) || 1) + 1,
      total_time_seconds: (parseInt(existingDay.total_time_seconds) || 0) + (parseInt(timeSpentSeconds) || 0),
      total_questions: (parseInt(existingDay.total_questions) || 0) + (parseInt(questionsAttempted) || 0),
      last_activity_type: activityType || existingDay.last_activity_type,
      updated_at: nowIso
    });
  } else {
    // First activity for today
    await db.insert('student_study_days', {
      user_id: userId,
      study_date: todayStr,
      activities_count: 1,
      total_time_seconds: parseInt(timeSpentSeconds) || 0,
      total_questions: parseInt(questionsAttempted) || 0,
      last_activity_type: activityType,
      created_at: nowIso,
      updated_at: nowIso
    });
  }

  // 2. Retrieve all active study days for this student
  let allUserDays = [];
  try {
    allUserDays = await db.find('student_study_days', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_study_days');
    allUserDays = all.filter(d => String(d.user_id) === String(userId));
  }

  const activeDates = allUserDays.map(d => d.study_date);

  // 3. Retrieve student's current streak record to maintain permanent longest streak
  let streakRecord = null;
  try {
    streakRecord = await db.findOne('student_streaks', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_streaks');
    streakRecord = all.find(s => String(s.user_id) === String(userId));
  }

  const permanentLongest = streakRecord?.longest_streak || 0;
  const streakCalc = calculateStreakFromDates(activeDates, todayStr, permanentLongest);

  // 4. Upsert student_streaks
  if (streakRecord) {
    await db.update('student_streaks', streakRecord.id, {
      current_streak: streakCalc.current_streak,
      longest_streak: streakCalc.longest_streak,
      last_studied_date: todayStr,
      total_active_days: streakCalc.total_active_days,
      updated_at: nowIso
    });
  } else {
    await db.insert('student_streaks', {
      user_id: userId,
      current_streak: streakCalc.current_streak,
      longest_streak: streakCalc.longest_streak,
      last_studied_date: todayStr,
      total_active_days: streakCalc.total_active_days,
      updated_at: nowIso
    });
  }

  // 5. Check and award any new milestone
  let newMilestone = null;
  let awardedMilestones = [];
  try {
    awardedMilestones = await db.find('student_streak_milestones', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_streak_milestones');
    awardedMilestones = all.filter(m => String(m.user_id) === String(userId));
  }

  const awardedIds = new Set(awardedMilestones.map(m => m.milestone_id));

  for (const m of STREAK_MILESTONES) {
    if (streakCalc.current_streak >= m.days && !awardedIds.has(m.id)) {
      try {
        await db.insert('student_streak_milestones', {
          user_id: userId,
          milestone_id: m.id,
          days: m.days,
          achieved_at: nowIso
        });
        awardedIds.add(m.id);
        newMilestone = m;
      } catch (_milestoneErr) {}
    }
  }

  return {
    ...streakCalc,
    new_milestone: newMilestone
  };
}

/**
 * Retrieve comprehensive streak details for a student
 */
async function getStudentStreakData(userId) {
  if (!userId) {
    return {
      current_streak: 0,
      longest_streak: 0,
      studied_today: false,
      studied_yesterday: false,
      total_active_days: 0,
      today_date: getKolkataDateString(),
      weekly_activity: getWeeklyActivityIndicator(new Set(), getKolkataDateString()),
      active_dates: [],
      milestones: STREAK_MILESTONES.map(m => ({ ...m, achieved: false, achieved_at: null })),
      new_milestone: null
    };
  }

  // 1. Backfill attempts if needed
  await syncExistingAttemptsToStudyDays(userId);

  // 2. Fetch all study days
  let allUserDays = [];
  try {
    allUserDays = await db.find('student_study_days', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_study_days');
    allUserDays = all.filter(d => String(d.user_id) === String(userId));
  }

  const activeDates = allUserDays.map(d => d.study_date);
  const activeSet = new Set(activeDates);

  // 3. Fetch persistent streak record
  let streakRecord = null;
  try {
    streakRecord = await db.findOne('student_streaks', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_streaks');
    streakRecord = all.find(s => String(s.user_id) === String(userId));
  }

  const todayStr = getKolkataDateString();
  const permanentLongest = streakRecord?.longest_streak || 0;
  const streakCalc = calculateStreakFromDates(activeDates, todayStr, permanentLongest);

  // If streak changed, persist update
  if (streakRecord) {
    if (streakRecord.current_streak !== streakCalc.current_streak || 
        streakRecord.longest_streak !== streakCalc.longest_streak ||
        streakRecord.total_active_days !== streakCalc.total_active_days) {
      await db.update('student_streaks', streakRecord.id, {
        current_streak: streakCalc.current_streak,
        longest_streak: streakCalc.longest_streak,
        total_active_days: streakCalc.total_active_days,
        updated_at: new Date().toISOString()
      });
    }
  } else if (activeDates.length > 0) {
    await db.insert('student_streaks', {
      user_id: userId,
      current_streak: streakCalc.current_streak,
      longest_streak: streakCalc.longest_streak,
      last_studied_date: activeDates[activeDates.length - 1],
      total_active_days: streakCalc.total_active_days,
      updated_at: new Date().toISOString()
    });
  }

  // 4. Fetch achieved milestones
  let awardedMilestones = [];
  try {
    awardedMilestones = await db.find('student_streak_milestones', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_streak_milestones');
    awardedMilestones = all.filter(m => String(m.user_id) === String(userId));
  }

  const awardedMap = new Map();
  awardedMilestones.forEach(m => {
    awardedMap.set(m.milestone_id, m.achieved_at);
  });

  const milestones = STREAK_MILESTONES.map(m => {
    const achieved = awardedMap.has(m.id) || streakCalc.longest_streak >= m.days;
    return {
      ...m,
      achieved: Boolean(achieved),
      achieved_at: awardedMap.get(m.id) || null
    };
  });

  // 5. Compute weekly activity (Mon - Sun)
  const weekly_activity = getWeeklyActivityIndicator(activeSet, todayStr);

  return {
    current_streak: streakCalc.current_streak,
    longest_streak: streakCalc.longest_streak,
    studied_today: streakCalc.studied_today,
    studied_yesterday: streakCalc.studied_yesterday,
    total_active_days: streakCalc.total_active_days,
    today_date: todayStr,
    weekly_activity,
    active_dates: streakCalc.active_dates,
    milestones,
    new_milestone: null
  };
}

/**
 * Retrieve monthly calendar data for streak view
 * year: 4-digit year (e.g. 2026)
 * month: 1-12
 */
async function getStudentMonthlyCalendar(userId, yearInput, monthInput) {
  const todayStr = getKolkataDateString();
  const now = new Date();
  const year = parseInt(yearInput) || now.getFullYear();
  const month = parseInt(monthInput) || (now.getMonth() + 1);

  // Fetch student study days
  let allUserDays = [];
  if (userId) {
    try {
      allUserDays = await db.find('student_study_days', { user_id: userId });
    } catch (_e) {
      const all = await db.getAll('student_study_days');
      allUserDays = all.filter(d => String(d.user_id) === String(userId));
    }
  }

  const dayMap = new Map();
  allUserDays.forEach(d => {
    dayMap.set(d.study_date, d);
  });

  // Calculate days in the specified month
  // month is 1-indexed, Date month is 0-indexed
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sun

  const days = [];
  let monthActiveDays = 0;
  let monthTotalQuestions = 0;
  let monthTotalTimeSeconds = 0;

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const padMonth = String(month).padStart(2, '0');
    const padDay = String(dayNum).padStart(2, '0');
    const dateStr = `${year}-${padMonth}-${padDay}`;
    const activity = dayMap.get(dateStr);

    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;
    const active = Boolean(activity);

    if (active) {
      monthActiveDays++;
      monthTotalQuestions += parseInt(activity.total_questions) || 0;
      monthTotalTimeSeconds += parseInt(activity.total_time_seconds) || 0;
    }

    days.push({
      day_number: dayNum,
      date: dateStr,
      active,
      is_today: isToday,
      is_past: isPast,
      is_future: isFuture,
      activities_count: activity ? (parseInt(activity.activities_count) || 1) : 0,
      total_questions: activity ? (parseInt(activity.total_questions) || 0) : 0,
      time_spent_seconds: activity ? (parseInt(activity.total_time_seconds) || 0) : 0,
      activity_type: activity?.last_activity_type || null
    });
  }

  // Get current streak stats
  const streakData = await getStudentStreakData(userId);

  return {
    year,
    month,
    month_name: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1)),
    first_day_of_week: firstDayOfWeek, // 0 = Sun, 1 = Mon, ...
    days_in_month: daysInMonth,
    days,
    month_summary: {
      active_days: monthActiveDays,
      total_questions: monthTotalQuestions,
      total_time_seconds: monthTotalTimeSeconds
    },
    current_streak: streakData.current_streak,
    longest_streak: streakData.longest_streak,
    total_active_days: streakData.total_active_days,
    milestones: streakData.milestones
  };
}

module.exports = {
  getKolkataDateString,
  parseKolkataDate,
  daysBetween,
  getYesterdayKolkata,
  getTomorrowKolkata,
  calculateStreakFromDates,
  getWeeklyActivityIndicator,
  recordStudyActivity,
  getStudentStreakData,
  getStudentMonthlyCalendar,
  STREAK_MILESTONES
};
