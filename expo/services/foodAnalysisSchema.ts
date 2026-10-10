import { z } from 'zod';

export const FoodAnalysisSchema = z.object({
  foods: z.array(z.object({
    name: z.string().trim().min(1).max(160).describe('Estimated food name and visible preparation method'),
    servingSize: z.string().trim().min(1).max(160).describe('Approximate serving weight and volume or count'),
    calories: z.number().finite().nonnegative().describe('Estimated calories for the identified food and estimated portion; no database lookup is available'),
    protein: z.number().finite().nonnegative().describe('Estimated protein in grams, using standard nutritional references'),
    carbs: z.number().finite().nonnegative().describe('Estimated total carbohydrates in grams'),
    fat: z.number().finite().nonnegative().describe('Estimated total fat in grams'),
    fiber: z.number().finite().nonnegative().describe('Estimated dietary fiber in grams'),
    sugar: z.number().finite().nonnegative().describe('Estimated sugar in grams'),
    saturatedFat: z.number().finite().nonnegative().describe('Estimated saturated fat in grams'),
    sodium: z.number().finite().nonnegative().describe('Estimated sodium in milligrams'),
    confidence: z.number().min(0).max(100).describe('Confidence level 0-100 for this specific food identification'),
    portionNotes: z.string().describe('Brief note about how the portion was estimated, e.g., "plate appears 10 inch diameter, portion covers ~40%"'),
    category: z.string().describe('Food category: protein, grain, vegetable, fruit, dairy, fat, beverage, condiment, mixed_dish, dessert, snack'),
  })).min(1).max(30),
  totalCalories: z.number().finite().nonnegative().describe('Sum of all food calories'),
  totalProtein: z.number().finite().nonnegative().describe('Sum of all food protein'),
  totalCarbs: z.number().finite().nonnegative().describe('Sum of all food carbs'),
  totalFat: z.number().finite().nonnegative().describe('Sum of all food fat'),
  totalFiber: z.number().finite().nonnegative().describe('Sum of all food fiber'),
  mealTypeGuess: z.string().describe('Best guess of meal type based on foods and composition: breakfast, lunch, dinner, or snack'),
  overallConfidence: z.number().min(0).max(100).describe('Overall confidence in the complete analysis'),
  healthScore: z.number().min(0).max(10).describe('Health score 0-10 based on nutritional balance, variety, and quality'),
  healthNotes: z.string().describe('Brief 1-2 sentence health insight about this meal, e.g., "High protein meal with good fiber. Consider adding more vegetables for micronutrients."'),
  cuisineType: z.string().describe('Detected cuisine type if identifiable, e.g., "Italian", "Japanese", "American", "Mexican", or "Mixed/Unknown"'),
});

export type FoodAnalysis = z.infer<typeof FoodAnalysisSchema>;
