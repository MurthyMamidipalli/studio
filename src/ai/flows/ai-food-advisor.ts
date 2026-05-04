
'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate customized nutritional recommendations.
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
  try {
    return await foodRecommendationFlow(input);
  } catch (error) {
    console.error("AI Food Advisor Flow Error:", error);
    return {
      recommendations: [
        {
          mealType: 'post-workout',
          name: 'Balanced Protein Bowl',
          description: 'A reliable post-activity meal focusing on muscle repair and energy replenishment.',
          macros: { protein: '25g', carbs: '40g', fats: '10g' }
        }
      ],
      advisorNote: "We encountered a temporary issue generating specific plans, but remember to prioritize lean protein and hydration throughout your day."
    };
  }
}

const foodRecommendationPrompt = ai.definePrompt({
  name: 'foodRecommendationPrompt',
  input: {schema: FoodRecommendationInputSchema},
  output: {schema: FoodRecommendationOutputSchema},
  prompt: `You are an expert sports nutritionist AI. 
Analyze the following context to provide meal recommendations.

User Context:
- Recent Workouts: {{{recentWorkouts}}}
- Goals: {{{userGoals}}}
- Body Stats: {{{bodyStats}}}

Requirements:
1. Provide 3-4 balanced meal suggestions.
2. If data is missing or generic (e.g., "None recent"), provide high-quality general fitness nutrition advice suitable for an active lifestyle.
3. Prioritize recovery-focused meals if workouts are mentioned.
4. Explain the nutritional logic for each choice.
5. Return the output strictly in the requested JSON format.`,
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
