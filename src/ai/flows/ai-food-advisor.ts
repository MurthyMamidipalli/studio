
'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate customized nutritional recommendations based on workout history.
 *
 * - generateFoodRecommendations - A function that handles the generation of meal suggestions.
 * - FoodRecommendationInput - The input type for the generateFoodRecommendations function.
 * - FoodRecommendationOutput - The return type for the generateFoodRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FoodRecommendationInputSchema = z.object({
  recentWorkouts: z.string().describe("A summary of the user's most recent workout sessions."),
  userGoals: z.string().describe("The user's current fitness and health goals."),
  bodyStats: z.string().describe("User's weight, height, and age if available."),
});
export type FoodRecommendationInput = z.infer<typeof FoodRecommendationInputSchema>;

const MealSuggestionSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'post-workout']),
  name: z.string().describe('Name of the suggested meal.'),
  description: z.string().describe('Brief description of why this meal is recommended.'),
  macros: z.object({
    protein: z.string(),
    carbs: z.string(),
    fats: z.string(),
  }).optional(),
});

const FoodRecommendationOutputSchema = z.object({
  recommendations: z.array(MealSuggestionSchema).describe('List of recommended meals.'),
  advisorNote: z.string().describe('General advice from the AI nutritionist.'),
});
export type FoodRecommendationOutput = z.infer<typeof FoodRecommendationOutputSchema>;

export async function generateFoodRecommendations(
  input: FoodRecommendationInput
): Promise<FoodRecommendationOutput> {
  return foodRecommendationFlow(input);
}

const foodRecommendationPrompt = ai.definePrompt({
  name: 'foodRecommendationPrompt',
  input: {schema: FoodRecommendationInputSchema},
  output: {schema: FoodRecommendationOutputSchema},
  prompt: `You are an expert sports nutritionist AI. 
Analyze the user's recent workout intensity and their goals to provide highly specific meal recommendations.

Workouts: {{{recentWorkouts}}}
Goals: {{{userGoals}}}
Stats: {{{bodyStats}}}

Provide a balanced set of recommendations for the day, prioritizing a post-workout recovery meal if they worked out recently. 
Explain the nutritional logic for each choice (e.g., "High protein for muscle repair after your heavy lifting session").`,
});

const foodRecommendationFlow = ai.defineFlow(
  {
    name: 'foodRecommendationFlow',
    inputSchema: FoodRecommendationInputSchema,
    outputSchema: FoodRecommendationOutputSchema,
  },
  async input => {
    const {output} = await foodRecommendationPrompt(input);
    return output!;
  }
);
