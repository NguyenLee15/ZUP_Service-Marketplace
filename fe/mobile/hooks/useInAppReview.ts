import * as StoreReview from 'expo-store-review';

export function useInAppReview() {
  const triggerReview = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch (error) {
      console.warn('In-app review requested but failed:', error);
    }
  };

  return { triggerReview };
}
