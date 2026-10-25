import { API_BASE_URL } from '../config/api';

/**
 * Log student action within the DDCET RankRise portal.
 * Non-blocking fire-and-forget helper.
 * 
 * @param {Object} params
 * @param {string} params.type - 'login' | 'practice' | 'mock_test' | 'material_view' | 'mistake_review' | 'portal_navigation'
 * @param {string} [params.action_name] - Descriptive label (e.g., "Viewed Calculus PDF")
 * @param {number} [params.topic_id] - Optional topic ID
 * @param {number} [params.time_spent_seconds] - Duration in seconds
 * @param {number} [params.questions_attempted] - MCQs attempted in session
 * @param {Object} [params.details] - Arbitrary additional metadata
 */
export async function logPortalActivity({
  type = 'portal_action',
  action_name = '',
  topic_id = null,
  time_spent_seconds = 0,
  questions_attempted = 0,
  details = {}
} = {}) {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('rankrise_user');
    let userId = null;
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        userId = u.id;
      } catch (e) {}
    }

    if (!userId && !token) {
      // Guest action - omitted from student persistence
      return;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE_URL}/api/student/activity/log`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        type,
        action_name,
        topic_id,
        time_spent_seconds,
        questions_attempted,
        details
      })
    }).catch(() => {
      // Non-blocking, ignore transient network drops
    });
  } catch (err) {
    // Silent catch so UI is never interrupted
  }
}
