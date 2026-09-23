// Derives the DISPLAY state of each lesson in a course from data the server
// supplies (`completed`, `free_preview`) under the server's own documented
// sequential-progression rule (§10.1: lessons are strictly sequential and
// continuous across section boundaries; LessonPolicy authorises every open).
//
// This is presentation only and is intentionally never used for authorization:
//   - it reads only server-supplied booleans (completed / free_preview) — never
//     a lesson index, a completion percentage, localStorage, or the URL;
//   - it is equal-to-or-more-restrictive than the server, which remains the sole
//     authority and fail-closes on open (a "locked" row is non-interactive, and
//     even a forced navigation is denied by the server);
//   - accessibility is continuous across sections, matching the server, not
//     reset per section.
//
// A future explicit per-lesson access field in the listing (see the milestone
// gap report) would let the client render the lock verbatim instead of deriving
// it from completion; until then this renders the server's known rule from the
// server's completion truth.
//
// Returns a flat array aligned to the course's ordered lessons:
//   { id, number, state: 'done'|'available'|'locked', freePreview, current }
// `number` is the continuous 1-based position across the whole course.
// `current` marks the first accessible, not-yet-completed lesson (the one to
// resume); at most one lesson is `current`.
export const courseLessonDisplay = (sections = []) => {
  const ordered = sections.flatMap((section) => section.lessons ?? []);

  let allPriorCompleted = true;
  let currentAssigned = false;

  return ordered.map((lesson, index) => {
    const accessible = lesson.free_preview || allPriorCompleted;
    let state;
    let current = false;
    if (lesson.completed) {
      state = 'done';
    } else if (accessible) {
      state = 'available';
      if (!currentAssigned) {
        current = true;
        currentAssigned = true;
      }
    } else {
      state = 'locked';
    }
    allPriorCompleted = allPriorCompleted && lesson.completed;
    return {
      id: lesson.id,
      number: index + 1,
      state,
      current,
      freePreview: Boolean(lesson.free_preview),
    };
  });
};

// Course-scoped lesson progress from the section listing (server `completed`).
// Genuine course-scoped lesson completion — distinct from the track-scoped
// enrollment progress used on Home/My Learning.
export const courseLessonProgress = (sections = []) => {
  const lessons = sections.flatMap((section) => section.lessons ?? []);
  const total = lessons.length;
  const completed = lessons.filter((l) => l.completed).length;
  return { completed, total };
};
