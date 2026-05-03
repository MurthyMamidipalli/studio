'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate customized workout routines based on user data.
 *
 * - generateWorkoutInspiration - A function that handles the generation of workout routines.
 * - WorkoutInspirationInput - The input type for the generateWorkoutInspiration function.
 * - WorkoutInspirationOutput - The return type for the generateWorkoutInspiration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutInspirationInputSchema = z.object({
  pastWorkoutsSummary: z
    .string()
    .describe(
      "A concise summary of the user's past workout data, including types, frequencies, and intensity levels."
    ),
  currentGoalsSummary: z
    .string()
    .describe(
      "A summary of the user's current fitness goals (e.g., 'improve cardio endurance', 'build muscle', 'lose weight')."
    ),
});
export type WorkoutInspirationInput = z.infer<typeof WorkoutInspirationInputSchema>;

const WorkoutExerciseSchema = z.object({
  name: z
    .string()
    .describe('The name of the exercise (e.g., "Push-ups", "Running").'),
  type: z.enum(['cardio', 'strength']).describe('The type of exercise: "cardio" or "strength".'),
  sets: z.number().optional().describe('Number of sets for strength training exercises.'),
  reps: z.number().optional().describe('Number of repetitions per set for strength training exercises.'),
  weight: z
    .string()
    .optional()
    .describe('Weight used for strength training (e.g., "bodyweight", "10kg dumbbells").'),
  durationMinutes: z.number().optional().describe('Duration in minutes for cardio exercises.'),
  intensity: z
    .string()
    .optional()
    .describe('Intensity level for cardio exercises (e.g., "moderate", "high").'),
  description: z
    .string()
    .optional()
    .describe('A brief description or instruction for the exercise.'),
});

const WorkoutInspirationOutputSchema = z.object({
  routine: z
    .array(WorkoutExerciseSchema)
    .describe('An array of suggested exercises for the workout routine.'),
  summary: z.string().describe('A brief summary or motivational message for the suggested routine.'),
});
export type WorkoutInspirationOutput = z.infer<typeof WorkoutInspirationOutputSchema>;

export async function generateWorkoutInspiration(
  input: WorkoutInspirationInput
): Promise<WorkoutInspirationOutput> {
  return workoutInspirationFlow(input);
}

const workoutInspirationPrompt = ai.definePrompt({
  name: 'workoutInspirationPrompt',
  input: {schema: WorkoutInspirationInputSchema},
  output: {schema: WorkoutInspirationOutputSchema},
  prompt: `You are a fitness coach and an AI assistant specializing in creating short, customized workout routines.
Your goal is to analyze a user's past workout data and current fitness goals to suggest a new, effective, and motivating workout routine.

Here is a summary of the user's past logged workouts:
{{{pastWorkoutsSummary}}}

Here are the user's current fitness goals:
{{{currentGoalsSummary}}}

Based on this information, generate a short, customized workout routine.
The routine should include specific exercises, with details like sets, reps, weight (for strength), or duration and intensity (for cardio).
Ensure the routine is balanced and helps the user progress towards their goals.
Provide a brief motivational summary for the routine.`,
});

const workoutInspirationFlow = ai.defineFlow(
  {
    name: 'workoutInspirationFlow',
    inputSchema: WorkoutInspirationInputSchema,
    outputSchema: WorkoutInspirationOutputSchema,
  },
  async input => {
    const {output} = await workoutInspirationPrompt(input);
    return output!;
  }
);
