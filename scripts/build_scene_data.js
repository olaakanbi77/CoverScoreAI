/**
 * Build 7-scene production format for all 60 CCA lessons.
 * Uses exact user-provided scripts for lessons 1.2 (id=50) and 1.3 (id=51).
 * Auto-generates for remaining lessons from existing video_script/content.
 */
const sqlite3 = require('sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'coverscore.db');
const db = new sqlite3.Database(DB_PATH);

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<\/p>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n').replace(/<\/div>/gi, '\n\n').replace(/<\/li>/gi, '\n').replace(/<li>/gi, '\n• ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function extractContent(html, sectionName) {
  if (!html) return '';
  const regex = new RegExp(`<h2>${sectionName}<\\/h2>\\s*([\\s\\S]*?)(?=<section class="lesson-section|<h2>|$)`, 'i');
  const m = html.match(regex);
  if (!m) return '';
  return stripHtml(m[1]);
}

function extractObjectives(html) {
  const text = extractContent(html, 'Learning Objectives');
  return text.replace(/^• /gm, '').split('\n').filter(s => s.trim().length > 5).map(s => s.replace(/^•\s*/, ''));
}

function extractTakeaways(html) {
  const text = extractContent(html, 'Key Takeaways');
  return text.replace(/^• /gm, '').split('\n').filter(s => s.trim().length > 5).map(s => s.replace(/^•\s*/, ''));
}

// Full scene scripts for lessons with user-provided spec
const EXACT_SCRIPTS = {
  50: { // What Is Risk? — Lesson 1.2
    moduleLabel: '1.2',
    scenes: [
      {
        id: 1, name: 'Welcome', duration: 45,
        slideTitle: 'What Is Risk?',
        narration: `Welcome back. Before we can recommend insurance solutions, we must first understand risk itself. Many people think insurance is the starting point. It isn't. Risk is. Every decision we make as advisors begins with understanding what could go wrong, how likely it is, and what impact it could have. Let's explore why.`
      },
      {
        id: 2, name: 'Learning Objectives', duration: 30,
        slideTitle: 'Learning Objectives',
        narration: `By the end of this lesson you will be able to define risk, distinguish it from uncertainty, understand why risk awareness matters, and explain how the CoverScore methodology transforms traditional insurance selling into professional risk advisory.`
      },
      {
        id: 3, name: 'What Is Risk?', duration: 180,
        slideTitle: 'What Is Risk?',
        narration: `Risk is the possibility that an event may occur and produce an undesirable outcome. Within insurance, risk refers to the possibility of financial loss. Every person lives with risk. Families face health risks. Businesses face operational risks. Drivers face accident risks. Property owners face fire risks. The important question is not whether risk exists. It is whether we are prepared for it.`
      },
      {
        id: 4, name: 'Risk vs Uncertainty', duration: 150,
        slideTitle: 'Risk vs Uncertainty',
        narration: `Many people use these words interchangeably. They are different. Risk involves probability that can be estimated. Historical data exists. Losses can be measured. Risk is usually insurable. For example, the likelihood of a house fire. Uncertainty involves no reliable probability. Limited historical information makes outcomes difficult to predict. Uncertainty is usually not insurable. For example, whether a completely new technology will dominate the market. Insurance exists because many risks are measurable.`
      },
      {
        id: 5, name: 'Why Risk Awareness Matters', duration: 150,
        slideTitle: 'Why Risk Awareness Matters',
        narration: `Unfortunately, most people only think about risk after suffering a loss. That reactive mindset creates unnecessary financial hardship. In Nigeria, many small businesses operate without adequate insurance. Life assurance penetration remains very low. Unexpected medical emergencies often strain household finances. As a CoverScore Advisor, your responsibility is to help clients recognize and prioritize risks before they become costly realities.`
      },
      {
        id: 6, name: 'CoverScore Insight', duration: 30,
        slideTitle: 'CoverScore Insight',
        narration: `Risk is not about fear. Risk is about readiness. Professional advisors don't create fear. They create preparedness.`
      },
      {
        id: 7, name: 'Lesson Summary', duration: 60,
        slideTitle: 'Key Takeaways',
        narration: `Today you've learned that risk is a measurable possibility of loss. You've seen the difference between risk and uncertainty. Most importantly, you've discovered why CoverScore begins with assessment rather than products. Professional advisors don't wait for disasters. They help clients prepare before disasters occur.`
      }
    ]
  },
  51: { // Types of Risk — Lesson 1.3
    moduleLabel: '1.3',
    scenes: [
      {
        id: 1, name: 'Welcome', duration: 45,
        slideTitle: 'Types of Risk',
        narration: `In our previous lesson, we learned that risk is the possibility of financial loss. Today we'll go one step further. Not every risk can be insured. Professional advisors must distinguish between different types of risk before recommending protection solutions. Let's begin.`
      },
      {
        id: 2, name: 'Learning Objectives', duration: 30,
        slideTitle: 'Learning Objectives',
        narration: `In this lesson, you'll learn the difference between pure risk and speculative risk, understand why insurers cover some risks but not others, and practice identifying insurable risks in everyday life and business.`
      },
      {
        id: 3, name: 'What Are Types of Risk?', duration: 120,
        slideTitle: 'Types of Risk',
        narration: `Not every uncertainty is treated the same way. Risk can generally be divided into two major categories: pure risk and speculative risk. Understanding this distinction helps determine whether insurance is an appropriate solution.`
      },
      {
        id: 4, name: 'Pure Risk vs Speculative Risk', duration: 180,
        slideTitle: 'Pure vs Speculative Risk',
        narration: `Pure risk involves situations where there are only two possible outcomes: loss or no loss. There is no opportunity to make a profit from the event itself. Examples include fire, theft, road accidents, illness, disability, and death. These events happen unexpectedly and create financial hardship. Because insurers can estimate their likelihood using historical data, pure risks are generally insurable. Speculative risk involves three possible outcomes: loss, no change, or profit. These risks arise from decisions made in pursuit of financial gain. Examples include investing in shares, trading cryptocurrency, and starting a new business. Because these risks involve the possibility of profit, they are generally not insurable.`
      },
      {
        id: 5, name: 'Why Insurance Covers Pure Risks', duration: 150,
        slideTitle: 'Why Insurance Covers Pure Risks',
        narration: `Insurance works because many people face similar accidental risks. Historical data allows insurers to estimate probabilities. Losses occur randomly across a large population. Premiums collected from many policyholders fund the claims of the few who suffer losses. Speculative risks are different because outcomes depend on individual choices, market conditions, and the possibility of profit. If insurers covered speculative losses, they would effectively guarantee business success, which insurance is not designed to do.`
      },
      {
        id: 6, name: 'CoverScore Insight', duration: 30,
        slideTitle: 'CoverScore Insight',
        narration: `Insurance transfers accidental financial loss — not entrepreneurial decisions.`
      },
      {
        id: 7, name: 'Lesson Summary', duration: 60,
        slideTitle: 'Key Takeaways',
        narration: `Today you've learned that not every risk is insurable. Pure risks involve accidental losses and are generally suitable for insurance. Speculative risks involve the possibility of profit and are managed using business and financial strategies rather than insurance. Understanding this distinction is essential to becoming a trusted CoverScore Advisor.`
      }
    ]
  }
};

function autoGenerateScenes(lesson) {
  const { title, video_script, content, case_study, lesson_number, course_id } = lesson;
  const cleanTitle = title.replace(/ — .*$/, '').trim();
  const topicName = cleanTitle;
  const moduleLabel = `${course_id}.${lesson_number}`;

  // Parse existing content
  const objectives = extractObjectives(content);
  const takeaways = extractTakeaways(content);
  const bodyText = video_script ? stripHtml(video_script).replace(/^Title:.*$/m, '').trim() : stripHtml(content).substring(0, 2000);
  const csText = case_study ? stripHtml(case_study) : '';

  // Split body into segments for Main Concept and Deep Dive
  const bodyParagraphs = bodyText.split('\n\n').filter(p => p.trim().length > 20);
  const mainConceptNarration = bodyParagraphs.slice(0, Math.ceil(bodyParagraphs.length / 2)).join('. ');
  const deepDiveNarration = bodyParagraphs.slice(Math.ceil(bodyParagraphs.length / 2)).join('. ');

  // Build practical application from case study
  let practicalNarration = '';
  if (csText && csText.length > 10) {
    const csClean = csText.replace(/^Case Study:\s*[^\n]*\n*/i, '').trim();
    practicalNarration = `Let's apply this to a real scenario. ${csClean}`;
  } else {
    practicalNarration = `As a CoverScore Advisor, you will help clients identify their specific risk exposures and determine the most appropriate protection strategies. This practical skill comes from understanding the concepts we've covered and applying them to each client's unique situation.`;
  }

  // Build objectives list
  const objectivesList = objectives.length > 0
    ? objectives.join(', ')
    : 'understand the key concepts covered in this lesson';

  // Welcome scene - generic template
  const welcomeText = `Welcome to Lesson ${moduleLabel}: ${title}. Every decision we make as advisors begins with understanding what could go wrong, how likely it is, and what impact it could have. In this lesson, we explore this topic in depth.`;

  // Objectives scene
  const objectivesText = `By the end of this lesson you will be able to ${objectivesList}.`;

  return [
    {
      id: 1, name: 'Welcome', duration: 45,
      slideTitle: topicName,
      narration: welcomeText
    },
    {
      id: 2, name: 'Learning Objectives', duration: 30,
      slideTitle: 'Learning Objectives',
      narration: objectivesText
    },
    {
      id: 3, name: 'Main Concept', duration: 180,
      slideTitle: topicName,
      narration: mainConceptNarration.substring(0, 1500) || `In this lesson we explore ${title}. Understanding this topic is essential for every professional risk advisor.`
    },
    {
      id: 4, name: 'Deep Dive', duration: 150,
      slideTitle: `Understanding ${topicName}`,
      narration: deepDiveNarration.substring(0, 1200) || `Let's examine this topic in more detail. Professional advisors must understand the nuances to provide the best guidance to their clients.`
    },
    {
      id: 5, name: 'Practical Application', duration: 150,
      slideTitle: 'Practical Application',
      narration: practicalNarration.substring(0, 1200)
    },
    {
      id: 6, name: 'CoverScore Insight', duration: 30,
      slideTitle: 'CoverScore Insight',
      narration: `CoverScore Insight: Professional advisors don't sell policies. They build protection strategies based on understanding each client's unique risk profile.`
    },
    {
      id: 7, name: 'Lesson Summary', duration: 60,
      slideTitle: 'Key Takeaways',
      narration: takeaways.length > 0
        ? `Let's summarize what we've learned. ${takeaways.join('. ')}. These principles will guide your work as a CoverScore Advisor.`
        : `Today we've explored ${title}. Remember that understanding risk is the foundation of effective protection planning. Apply these concepts in every client conversation.`
    }
  ];
}

async function main() {
  // Add scene_data column if not exists
  await new Promise((res, rej) => {
    db.run("ALTER TABLE academy_modules ADD COLUMN scene_data TEXT", (err) => {
      if (err && !err.message.includes('duplicate column')) console.error('ALTER:', err.message);
      res();
    });
  });

  const lessons = await new Promise((res, rej) => {
    db.all("SELECT m.*, c.code FROM academy_modules m LEFT JOIN academy_courses c ON c.id = m.course_id WHERE m.id >= 50 ORDER BY m.id", (err, rows) => {
      if (err) rej(err); else res(rows);
    });
  });

  let updated = 0;
  for (const lesson of lessons) {
    let scenes;
    if (EXACT_SCRIPTS[lesson.id]) {
      scenes = EXACT_SCRIPTS[lesson.id].scenes;
    } else {
      scenes = autoGenerateScenes(lesson);
    }

    const sceneData = JSON.stringify(scenes);
    await new Promise((res, rej) => {
      db.run("UPDATE academy_modules SET scene_data = ? WHERE id = ?", [sceneData, lesson.id], (err) => {
        if (err) rej(err); else res();
      });
    });
    updated++;
    console.log(`  [${updated}/${lessons.length}] Lesson ${lesson.id}: ${lesson.title} — ${scenes.length} scenes`);
  }

  console.log(`\nDone. ${updated} lessons updated with scene data.`);
  db.close();
}

main().catch(e => { console.error(e); db.close(); process.exit(1); });
