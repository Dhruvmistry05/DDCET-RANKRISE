/**
 * DDCET RankRise - Preparation Cycles & Restart Service
 * Allows students and authorized admins to safely restart DDCET preparation
 * while permanently preserving all historical attempts, scores, analytics, and streaks.
 */

const db = require('./db-adapter');

/**
 * Get comprehensive preparation cycle details for a student
 */
async function getStudentCycleInfo(userId) {
  if (!userId) throw new Error('userId is required');

  // 1. Fetch user to get current cycle number
  const user = await db.findOne('users', { id: userId });
  if (!user) throw new Error(`Student ${userId} not found`);

  const currentCycleNum = parseInt(user.current_cycle_number) || 1;
  const activeCycleStartedAt = user.active_cycle_started_at || user.first_login_at || new Date().toISOString();

  // 2. Fetch all recorded cycles for this student
  let cycles = [];
  try {
    cycles = await db.find('student_preparation_cycles', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_preparation_cycles');
    cycles = all.filter(c => String(c.user_id) === String(userId));
  }

  // If no cycle 1 exists yet, create it on-the-fly
  if (cycles.length === 0) {
    const defaultCycle = {
      user_id: userId,
      cycle_number: 1,
      status: 'active',
      started_at: activeCycleStartedAt,
      ended_at: null,
      restarted_by_user_id: userId,
      restarted_by_role: 'student',
      reason: 'Initial Preparation Cycle',
      snapshot_stats: null,
      created_at: activeCycleStartedAt
    };
    try {
      const created = await db.insert('student_preparation_cycles', defaultCycle);
      cycles = [created];
    } catch (_insErr) {
      cycles = [defaultCycle];
    }
  }

  // Sort cycles ascending
  cycles.sort((a, b) => (parseInt(a.cycle_number) || 1) - (parseInt(b.cycle_number) || 1));

  // 3. Fetch restart history
  let history = [];
  try {
    history = await db.find('student_restart_history', { student_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_restart_history');
    history = all.filter(h => String(h.student_id) === String(userId));
  }
  history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const activeCycle = cycles.find(c => c.cycle_number === currentCycleNum) || cycles[cycles.length - 1];

  return {
    student_id: userId,
    student_name: user.name || 'Student',
    student_email: user.email,
    current_cycle_number: currentCycleNum,
    active_cycle_started_at: activeCycleStartedAt,
    active_cycle: activeCycle,
    cycles,
    restart_history: history,
    total_restarts: history.length
  };
}

/**
 * Execute a preparation restart for a student
 * Starts a new cycle, resets current cycle progress, and archives the previous cycle.
 * ALL previous attempts, scores, and streaks are 100% permanently preserved.
 */
async function restartPreparationCycle({ userId, performedById, performedByRole = 'student', reason = '' }) {
  if (!userId) throw new Error('userId is required');

  const student = await db.findOne('users', { id: userId });
  if (!student) throw new Error(`Student ${userId} not found`);

  const currentCycleNum = parseInt(student.current_cycle_number) || 1;
  const nextCycleNum = currentCycleNum + 1;
  const nowIso = new Date().toISOString();

  // Find actor details for audit logging
  let actorEmail = student.email;
  if (performedById && String(performedById) !== String(userId)) {
    const actor = await db.findOne('users', { id: performedById });
    if (actor) actorEmail = actor.email;
  }

  // 1. Gather snapshot stats of the finishing cycle
  let userAttempts = [];
  try {
    userAttempts = await db.find('student_attempts', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_attempts');
    userAttempts = all.filter(a => String(a.user_id) === String(userId));
  }
  const cycleAttempts = userAttempts.filter(a => (parseInt(a.cycle_number) || 1) === currentCycleNum);

  let topicProgress = [];
  try {
    topicProgress = await db.find('student_topic_progress', { user_id: userId });
  } catch (_e) {
    const all = await db.getAll('student_topic_progress');
    topicProgress = all.filter(tp => String(tp.user_id) === String(userId));
  }
  const cycleCompletedTopics = topicProgress.filter(tp => (parseInt(tp.cycle_number) || 1) === currentCycleNum && tp.completed).length;

  const snapshotStats = {
    cycle_number: currentCycleNum,
    tests_completed_in_cycle: cycleAttempts.length,
    topics_completed_in_cycle: cycleCompletedTopics,
    archived_at: nowIso
  };

  // 2. Archive current cycle in student_preparation_cycles
  let existingCycleRec = null;
  try {
    existingCycleRec = await db.findOne('student_preparation_cycles', { user_id: userId, cycle_number: currentCycleNum });
  } catch (_e) {
    const all = await db.getAll('student_preparation_cycles');
    existingCycleRec = all.find(c => String(c.user_id) === String(userId) && c.cycle_number === currentCycleNum);
  }

  if (existingCycleRec) {
    await db.update('student_preparation_cycles', existingCycleRec.id, {
      status: 'archived',
      ended_at: nowIso,
      snapshot_stats: snapshotStats
    });
  } else {
    // Insert archived cycle
    await db.insert('student_preparation_cycles', {
      user_id: userId,
      cycle_number: currentCycleNum,
      status: 'archived',
      started_at: student.active_cycle_started_at || student.first_login_at || nowIso,
      ended_at: nowIso,
      restarted_by_user_id: performedById,
      restarted_by_role: performedByRole,
      reason: reason || 'Completed preparation cycle',
      snapshot_stats: snapshotStats,
      created_at: nowIso
    });
  }

  // 3. Create NEW active cycle in student_preparation_cycles
  const newCycle = await db.insert('student_preparation_cycles', {
    user_id: userId,
    cycle_number: nextCycleNum,
    status: 'active',
    started_at: nowIso,
    ended_at: null,
    restarted_by_user_id: performedById,
    restarted_by_role: performedByRole,
    reason: reason || (performedByRole === 'admin' ? 'Restarted by administrator' : 'Student self-restart'),
    snapshot_stats: null,
    created_at: nowIso
  });

  // 4. Update student's user record with the new cycle number
  await db.update('users', userId, {
    current_cycle_number: nextCycleNum,
    active_cycle_started_at: nowIso
  });

  // 5. Insert permanent audit log into student_restart_history
  const actionName = performedByRole === 'admin' ? 'Admin Restarted Preparation' : 'Student Self-Restart';
  await db.insert('student_restart_history', {
    student_id: userId,
    from_cycle: currentCycleNum,
    to_cycle: nextCycleNum,
    action_performed: actionName,
    performed_by_id: performedById,
    performed_by_email: actorEmail,
    performed_by_role: performedByRole,
    reason: reason || (performedByRole === 'admin' ? 'Admin requested preparation reset' : 'Student initiated preparation reset'),
    created_at: nowIso
  });

  return {
    success: true,
    previous_cycle_number: currentCycleNum,
    new_cycle_number: nextCycleNum,
    active_cycle_started_at: nowIso,
    restarted_by_role: performedByRole,
    snapshot_stats: snapshotStats
  };
}

/**
 * Get all students with their cycle overview and restart history (Admin only)
 */
async function getAllStudentsCycleOverview() {
  let allUsers = [];
  try {
    allUsers = await db.getAll('users');
  } catch (_e) {
    allUsers = [];
  }

  const students = allUsers.filter(u => u.role === 'student');

  let allCycles = [];
  try {
    allCycles = await db.getAll('student_preparation_cycles');
  } catch (_e) {
    allCycles = [];
  }

  let allHistory = [];
  try {
    allHistory = await db.getAll('student_restart_history');
  } catch (_e) {
    allHistory = [];
  }

  let allAttempts = [];
  try {
    allAttempts = await db.getAll('student_attempts');
  } catch (_e) {
    allAttempts = [];
  }

  return students.map(s => {
    const currentCycle = parseInt(s.current_cycle_number) || 1;
    const userCycles = allCycles.filter(c => String(c.user_id) === String(s.id));
    const userHistory = allHistory.filter(h => String(h.student_id) === String(s.id));
    const userAttempts = allAttempts.filter(a => String(a.user_id) === String(s.id));
    const currentCycleAttempts = userAttempts.filter(a => (parseInt(a.cycle_number) || 1) === currentCycle);

    userHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      id: s.id,
      name: s.name || 'Student',
      email: s.email,
      mobile: s.mobile || '',
      current_cycle_number: currentCycle,
      active_cycle_started_at: s.active_cycle_started_at || s.first_login_at || null,
      total_restarts: userHistory.length,
      last_restart: userHistory[0] || null,
      current_cycle_tests_count: currentCycleAttempts.length,
      all_time_tests_count: userAttempts.length,
      cycles: userCycles
    };
  });
}

module.exports = {
  getStudentCycleInfo,
  restartPreparationCycle,
  getAllStudentsCycleOverview
};
