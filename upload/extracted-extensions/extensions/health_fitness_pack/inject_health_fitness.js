(function() {
    'use strict';
    
    const PRDS = {
        prd_mobile_steps_tracker: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_STEPS_TRACKER]
MISSION: Suivi pas/journée.
STYLE & DESIGN: Ring + daily goal.
MAPPING VFS: StepsRing.tsx, StepsHistory.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_water_reminder: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_WATER_REMINDER]
MISSION: Rappels hydratation.
STYLE & DESIGN: Bottle UI, notifications.
MAPPING VFS: WaterTracker.tsx, IntakeList.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_workout_planner: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_WORKOUT_PLANNER]
MISSION: Planning entraînements.
STYLE & DESIGN: Workout cards, calendar.
MAPPING VFS: WorkoutPlan.tsx, WorkoutDetail.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_mood_journal: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_MOOD_JOURNAL]
MISSION: Journal humeur quotidien.
STYLE & DESIGN: Emoji scale, notes.
MAPPING VFS: MoodPicker.tsx, MoodTimeline.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_sleep_tracker: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SLEEP_TRACKER]
MISSION: Tracking sommeil (manuel/auto).
STYLE & DESIGN: Sleep graph.
MAPPING VFS: SleepChart.tsx, SleepEntry.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_nutrition_log: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_NUTRITION_LOG]
MISSION: Log alimentation (macro).
STYLE & DESIGN: Meal cards, charts.
MAPPING VFS: MealList.tsx, MacrosSummary.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_breathing_exercise: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_BREATHING_EXERCISE]
MISSION: Exercices respiration guidés.
STYLE & DESIGN: Circle animation.
MAPPING VFS: BreathingGuide.tsx, SessionConfig.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_meditation_sessions: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_MEDITATION_SESSIONS]
MISSION: Sessions audio méditation.
STYLE & DESIGN: Playlist, session screen.
MAPPING VFS: MeditationList.tsx, MeditationPlayer.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_health_goals: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_HEALTH_GOALS]
MISSION: Objectifs santé multi‑metrics.
STYLE & DESIGN: Goal cards, progress bars.
MAPPING VFS: HealthGoals.tsx, GoalProgress.tsx
[FIN DU CONTEXTE CACHÉ]`,
        prd_mobile_symptom_tracker: `[CONTEXTE CACHÉ - PRD PRD_MOBILE_SYMPTOM_TRACKER]
MISSION: Suivi symptômes/journal santé.
STYLE & DESIGN: Form journals, charts.
MAPPING VFS: SymptomForm.tsx, SymptomHistory.tsx
[FIN DU CONTEXTE CACHÉ]`,

    };

    function injectText(text, name) {
        const input = document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
        if (input) {
            input.value = text + "\n\n" + input.value;
            const badge = document.createElement('div');
            badge.style = "position:fixed; top:60px; right:20px; background:#FF6600; color:black; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:9999;";
            badge.innerText = "✅ PRD Injecté : " + name;
            document.body.appendChild(badge);
            setTimeout(() => badge.remove(), 4000);
        } else {
            alert("Veuillez cliquer dans la zone de texte de l'IA d'abord !");
        }
    }

    function createMenu() {
        if(document.getElementById('health_fitness_pack-menu')) return;
        
        const menu = document.createElement('div');
        menu.id = 'health_fitness_pack-menu';
        menu.style = "position:fixed; bottom:20px; right:20px; background:rgba(10,15,25,0.9); border:1px solid #FF6600; padding:15px; border-radius:10px; z-index:999999; color:white; font-family:sans-serif; width: 250px; max-height: 400px; overflow-y: auto;";
        
        menu.innerHTML = `
            <h3 style="margin-top:0; font-size:14px; color:#FF6600;">📦 Health & Fitness Pack</h3>
            <button id="btn-prd-prd_mobile_steps_tracker-0" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_steps_tracker</button>
            <button id="btn-prd-prd_mobile_water_reminder-1" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_water_reminder</button>
            <button id="btn-prd-prd_mobile_workout_planner-2" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_workout_planner</button>
            <button id="btn-prd-prd_mobile_mood_journal-3" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_mood_journal</button>
            <button id="btn-prd-prd_mobile_sleep_tracker-4" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_sleep_tracker</button>
            <button id="btn-prd-prd_mobile_nutrition_log-5" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_nutrition_log</button>
            <button id="btn-prd-prd_mobile_breathing_exercise-6" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_breathing_exercise</button>
            <button id="btn-prd-prd_mobile_meditation_sessions-7" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_meditation_sessions</button>
            <button id="btn-prd-prd_mobile_health_goals-8" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_health_goals</button>
            <button id="btn-prd-prd_mobile_symptom_tracker-9" style="display:block; width:100%; margin-bottom:5px; padding:8px; background:#112; border:1px solid #FF6600; color:#FF6600; cursor:pointer; border-radius:5px;">🚀 prd_mobile_symptom_tracker</button>

        `;
        
        document.body.appendChild(menu);
        document.getElementById('btn-prd-prd_mobile_steps_tracker-0').onclick = () => injectText(PRDS.prd_mobile_steps_tracker, 'prd_mobile_steps_tracker');
        document.getElementById('btn-prd-prd_mobile_water_reminder-1').onclick = () => injectText(PRDS.prd_mobile_water_reminder, 'prd_mobile_water_reminder');
        document.getElementById('btn-prd-prd_mobile_workout_planner-2').onclick = () => injectText(PRDS.prd_mobile_workout_planner, 'prd_mobile_workout_planner');
        document.getElementById('btn-prd-prd_mobile_mood_journal-3').onclick = () => injectText(PRDS.prd_mobile_mood_journal, 'prd_mobile_mood_journal');
        document.getElementById('btn-prd-prd_mobile_sleep_tracker-4').onclick = () => injectText(PRDS.prd_mobile_sleep_tracker, 'prd_mobile_sleep_tracker');
        document.getElementById('btn-prd-prd_mobile_nutrition_log-5').onclick = () => injectText(PRDS.prd_mobile_nutrition_log, 'prd_mobile_nutrition_log');
        document.getElementById('btn-prd-prd_mobile_breathing_exercise-6').onclick = () => injectText(PRDS.prd_mobile_breathing_exercise, 'prd_mobile_breathing_exercise');
        document.getElementById('btn-prd-prd_mobile_meditation_sessions-7').onclick = () => injectText(PRDS.prd_mobile_meditation_sessions, 'prd_mobile_meditation_sessions');
        document.getElementById('btn-prd-prd_mobile_health_goals-8').onclick = () => injectText(PRDS.prd_mobile_health_goals, 'prd_mobile_health_goals');
        document.getElementById('btn-prd-prd_mobile_symptom_tracker-9').onclick = () => injectText(PRDS.prd_mobile_symptom_tracker, 'prd_mobile_symptom_tracker');

    }

    setTimeout(createMenu, 3000);
})();
