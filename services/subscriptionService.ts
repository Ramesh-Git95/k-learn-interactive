import { apiClient } from './apiClient';

export interface SubscriptionData {
  planId: string;
  subscriptionId: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Create a PayPal subscription plan
   * Note: In production, this should be done on your backend server
   */
  async createSubscriptionPlan(planData: {
    name: string;
    description: string;
    price: string;
    currency: string;
    interval: 'month' | 'year';
  }) {
    try {
      console.log('🔄 Creating subscription plan:', planData);
      
      // Mock plan creation - replace with actual backend call
      const mockPlanId = `P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        planId: mockPlanId,
        data: {
          id: mockPlanId,
          name: planData.name,
          description: planData.description,
          status: 'ACTIVE'
        }
      };
    } catch (error) {
      console.error('❌ Failed to create subscription plan:', error);
      return {
        success: false,
        error: 'Failed to create subscription plan'
      };
    }
  }

  /**
   * Handle successful PayPal subscription or mock payment
   */
  async handleSubscriptionSuccess(subscriptionId: string, planId: string) {
    try {
      console.log('🎉 Processing successful subscription:', { subscriptionId, planId });
      
      // Check if this is a mock payment
      const isMockPayment = subscriptionId.startsWith('MOCK-');
      
      if (isMockPayment) {
        console.log('🧪 Processing mock payment for testing');
      } else {
        console.log('💳 Processing real PayPal subscription');
      }
      
      // In a real application, you would:
      // 1. Verify the subscription with PayPal (if not mock)
      // 2. Update user's subscription status in your database
      // 3. Send confirmation email
      
      // For now, we'll just update the local user state
      // This would typically be done by calling your backend API
      
      const subscriptionData = {
        type: 'premium',
        status: 'active',
        hasAccess: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        paypalSubscriptionId: subscriptionId,
        planId: planId,
        isTestMode: isMockPayment
      };

      // Update via API (mock for now)
      const result = await this.updateUserSubscription(subscriptionData);
      
      if (result.success) {
        console.log('✅ Subscription activated successfully');
        
        // Show success message
        if (isMockPayment) {
          console.log('🧪 Mock payment processed - Premium features activated for testing!');
        } else {
          console.log('💳 PayPal payment processed - Premium subscription activated!');
        }
        
        return {
          success: true,
          subscription: subscriptionData
        };
      } else {
        throw new Error(result.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('❌ Failed to process subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process subscription'
      };
    }
  }

  /**
   * Update user subscription in backend
   * Mock implementation - replace with actual API call
   */
  private async updateUserSubscription(subscriptionData: any) {
    try {
      // This should be a real API call to your backend
      // For now, we'll simulate it
      console.log('🔄 Updating user subscription:', subscriptionData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        data: subscriptionData
      };
    } catch (error) {
      console.error('❌ Failed to update user subscription:', error);
      return {
        success: false,
        error: 'Failed to update subscription in database'
      };
    }
  }

  /**
   * Cancel PayPal subscription
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      console.log('🔄 Cancelling PayPal subscription:', subscriptionId);
      
      // In a real application, you would call your backend API
      // which would then cancel the subscription via PayPal's REST API
      
      // Mock cancellation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Subscription will be cancelled at the end of the current billing period'
      };
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      return {
        success: false,
        error: 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Get subscription details from PayPal
   */
  async getSubscriptionDetails(subscriptionId: string) {
    try {
      console.log('🔄 Fetching subscription details:', subscriptionId);
      
      // In a real application, you would call PayPal's API
      // to get the current subscription status
      
      // Mock subscription details
      return {
        success: true,
        data: {
          id: subscriptionId,
          status: 'ACTIVE',
          billing_info: {
            next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      };
    } catch (error) {
      console.error('❌ Failed to get subscription details:', error);
      return {
        success: false,
        error: 'Failed to fetch subscription details'
      };
    }
  }

  /**
   * Handle PayPal webhook events
   * This should be implemented on your backend server
   */
  async handleWebhook(eventType: string, eventData: any) {
    try {
      console.log('🔔 Processing PayPal webhook:', eventType, eventData);
      
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          // Handle subscription activation
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          // Handle subscription cancellation
          break;
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          // Handle subscription suspension
          break;
        case 'PAYMENT.SALE.COMPLETED':
          // Handle successful payment
          break;
        default:
          console.log('🤷 Unhandled webhook event type:', eventType);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to process webhook:', error);
      return {
        success: false,
        error: 'Failed to process webhook'
      };
    }
  }

  /**
   * Activate premium subscription for a user
   * This simulates activating premium features after successful payment
   */
  async activatePremium(planId: string) {
    try {
      console.log('🌟 Activating premium subscription for plan:', planId);
      
      // In a real application, you would:
      // 1. Update the user's subscription status in your database
      // 2. Grant access to premium features
      // 3. Send confirmation email
      // 4. Log the transaction
      
      // For demo purposes, we'll simulate this with localStorage
      const premiumData = {
        planId,
        status: 'active',
        activatedAt: new Date().toISOString(),
        expiresAt: planId.includes('yearly') 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : planId.includes('monthly')
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null // lifetime
      };
      
      localStorage.setItem('k-learn-premium', JSON.stringify(premiumData));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Premium subscription activated successfully');
      
      return {
        success: true,
        data: premiumData
      };
    } catch (error) {
      console.error('❌ Failed to activate premium subscription:', error);
      return {
        success: false,
        error: 'Failed to activate premium subscription'
      };
    }
  }

  /**
   * Check if user has active premium subscription
   */
  isPremiumActive(): boolean {
    try {
      const premiumData = localStorage.getItem('k-learn-premium');
      if (!premiumData) return false;
      
      const data = JSON.parse(premiumData);
      if (data.status !== 'active') return false;
      
      // Check if subscription has expired (for non-lifetime plans)
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking premium status:', error);
      return false;
    }
  }
}

export default SubscriptionService.getInstance();
