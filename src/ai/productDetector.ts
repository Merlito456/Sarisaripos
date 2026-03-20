import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model: mobilenet.MobileNet | null = null;

export async function loadDetectionModel() {
  if (model) return model;
  
  try {
    // In a real app, we might want to use a custom trained model for specific sari-sari products
    // For this demo, we use MobileNet which can recognize many common objects
    model = await mobilenet.load({
      version: 1,
      alpha: 1.0
    });
    console.log('AI Model loaded successfully');
    return model;
  } catch (error) {
    console.error('Failed to load AI model:', error);
    throw error;
  }
}

export async function detectProduct(imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
  if (!model) {
    await loadDetectionModel();
  }
  
  if (!model) return [];

  const predictions = await model.classify(imageElement);
  return predictions;
}

// Map MobileNet classes to our store products (simplified mapping for demo)
export function mapPredictionToProduct(prediction: string, products: any[]) {
  const lowerPrediction = prediction.toLowerCase();
  
  // Simple keyword matching
  return products.find(p => {
    const name = p.name.toLowerCase();
    const category = p.category.toLowerCase();
    return lowerPrediction.includes(name) || 
           name.includes(lowerPrediction) ||
           (category === 'Drinks' && (lowerPrediction.includes('bottle') || lowerPrediction.includes('drink'))) ||
           (category === 'Canned Goods' && lowerPrediction.includes('can'));
  });
}
