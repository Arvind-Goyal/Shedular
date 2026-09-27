/**
 * RevisionPlanner
 * Generates tailored revision and practice schedules for revision days
 * prioritizing:
 * 1. Recently completed topics
 * 2. Topics marked "Difficult"
 * 3. Topics with low practice / not revised recently
 * 4. Formula consolidation and Previous Year Questions (PYQs)
 */

/**
 * Plans revision tasks for a given date
 * @param {Object} params
 * @param {string} params.date - YYYY-MM-DD
 * @param {number} params.dailyStudyHours - e.g. 3.5
 * @param {Array} params.topics - All topics with completion status & difficulty
 * @param {Array} params.inProgressTopics - Topics currently being studied
 */
function planRevisionDay({
  date,
  dailyStudyHours = 3.5,
  topics = [],
  inProgressTopics = []
}) {
  const totalAvailableMinutes = Math.round(dailyStudyHours * 60);

  // Score topics for revision priority:
  const scoredTopics = topics.map(raw => {
    const t = raw.toObject ? raw.toObject() : raw;
    let score = 0;
    const isCompleted = (t.completedLectures || 0) >= (t.totalLectures || 1);
    const hasProgress = (t.completedLectures || 0) > 0;

    if (isCompleted) score += 50;
    else if (hasProgress) score += 30;
    else score += 5;

    if (t.difficulty === 'Difficult') score += 35;
    else if (t.difficulty === 'Medium') score += 15;
    else score += 5;

    // Time decay / last revised
    if (t.lastRevisedDate) {
      const daysSinceRev = Math.max(1, Math.round((new Date(date) - new Date(t.lastRevisedDate)) / (1000 * 60 * 60 * 24)));
      score += Math.min(40, daysSinceRev * 2);
    } else {
      score += 25; // Never revised yet
    }

    return {
      _id: t._id,
      name: t.name || 'Mathematics',
      totalLectures: t.totalLectures,
      completedLectures: t.completedLectures,
      difficulty: t.difficulty,
      priorityScore: score
    };
  });

  // Sort descending by score
  scoredTopics.sort((a, b) => b.priorityScore - a.priorityScore);

  // Pick top 2 topics to revise (or 1 if only 1 exists)
  const candidateTopics = scoredTopics.filter(t => (t.completedLectures || 0) > 0);
  const selectedTopics = candidateTopics.length > 0 
    ? candidateTopics.slice(0, 2)
    : scoredTopics.slice(0, 2);

  const tasks = [];
  let remainingMinutes = totalAvailableMinutes;

  if (selectedTopics.length === 1) {
    const topic = selectedTopics[0];
    // Allocate all revision minutes to this topic
    const formulaTime = 45;
    const pyqTime = 75;
    const practiceTime = Math.max(30, remainingMinutes - (formulaTime + pyqTime));

    tasks.push({
      topicId: topic._id,
      topicName: topic.name,
      type: 'revision',
      title: `${topic.name}: Formula revision & core concepts`,
      durationMinutes: formulaTime,
      subActivity: 'formulas'
    });

    tasks.push({
      topicId: topic._id,
      topicName: topic.name,
      type: 'pyq',
      title: `${topic.name}: SSC CHSL Previous Year Questions (PYQs)`,
      durationMinutes: pyqTime,
      subActivity: 'pyqs'
    });

    tasks.push({
      topicId: topic._id,
      topicName: topic.name,
      type: 'practice',
      title: `${topic.name}: Speed & accuracy practice drill`,
      durationMinutes: practiceTime,
      subActivity: 'practice'
    });
  } else if (selectedTopics.length >= 2) {
    const topicA = selectedTopics[0];
    const topicB = selectedTopics[1];

    // Divide time: Topic A (higher priority) gets ~60%, Topic B gets ~40%
    const timeA = Math.round(totalAvailableMinutes * 0.55);
    const timeB = totalAvailableMinutes - timeA;

    // Topic A tasks
    const aFormulas = 30;
    const aPYQs = timeA - aFormulas;
    tasks.push({
      topicId: topicA._id,
      topicName: topicA.name,
      type: 'revision',
      title: `${topicA.name}: Formula revision & error log`,
      durationMinutes: aFormulas,
      subActivity: 'formulas'
    });
    tasks.push({
      topicId: topicA._id,
      topicName: topicA.name,
      type: 'pyq',
      title: `${topicA.name}: SSC CHSL PYQs & tricky questions`,
      durationMinutes: aPYQs,
      subActivity: 'pyqs'
    });

    // Topic B tasks
    const bFormulas = 30;
    const bPractice = timeB - bFormulas;
    tasks.push({
      topicId: topicB._id,
      topicName: topicB.name,
      type: 'revision',
      title: `${topicB.name}: Formula recap & key theorems`,
      durationMinutes: bFormulas,
      subActivity: 'formulas'
    });
    tasks.push({
      topicId: topicB._id,
      topicName: topicB.name,
      type: 'practice',
      title: `${topicB.name}: Timed practice set & mock questions`,
      durationMinutes: bPractice,
      subActivity: 'practice'
    });
  }

  return tasks;
}

module.exports = {
  planRevisionDay
};
