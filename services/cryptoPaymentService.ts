// Simple crypto payment service for educational purposes
export interface CryptoPayment {
  amount: number;
  currency: 'BTC' | 'ETH' | 'USDC';
  address: string;
  qrCode?: string;
}

export interface CryptoPaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentAddress?: string;
}

export class CryptoPaymentService {
  private static instance: CryptoPaymentService;

  private constructor() {}

  static getInstance(): CryptoPaymentService {
    if (!CryptoPaymentService.instance) {
      CryptoPaymentService.instance = new CryptoPaymentService();
    }
    return CryptoPaymentService.instance;
  }

  // Mock crypto addresses for demo
  private getPaymentAddress(currency: 'BTC' | 'ETH' | 'USDC'): string {
    switch (currency) {
      case 'BTC':
        return 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      case 'ETH':
        return '0x742C3cF9Af45f91B109a81EfB85B206DC19B18EC';
      case 'USDC':
        return '0x742C3cF9Af45f91B109a81EfB85B206DC19B18EC';
      default:
        throw new Error('Unsupported cryptocurrency');
    }
  }

  private convertUSDToCrypto(usdAmount: number, currency: 'BTC' | 'ETH' | 'USDC'): number {
    // Mock conversion rates (in a real app, fetch from API)
    const rates = {
      BTC: 0.000025,  // ~$40,000 per BTC
      ETH: 0.00042,    // ~$2,400 per ETH
      USDC: 1.0        // 1:1 with USD
    };

    return usdAmount * rates[currency];
  }

  async createCryptoPayment(usdAmount: number, currency: 'BTC' | 'ETH' | 'USDC'): Promise<CryptoPayment> {
    const cryptoAmount = this.convertUSDToCrypto(usdAmount, currency);
    const address = this.getPaymentAddress(currency);
    
    // Generate QR code URL (using a free QR code service)
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currency}:${address}?amount=${cryptoAmount}`;

    return {
      amount: cryptoAmount,
      currency,
      address,
      qrCode
    };
  }

  async checkPaymentStatus(transactionId: string): Promise<CryptoPaymentResult> {
    // Simulate checking blockchain for transaction
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, randomly return success/pending
    const isSuccess = Math.random() > 0.5;
    
    if (isSuccess) {
      return {
        success: true,
        transactionId,
        paymentAddress: this.getPaymentAddress('BTC')
      };
    } else {
      return {
        success: false,
        error: 'Transaction not yet confirmed on blockchain'
      };
    }
  }

  // Simulate successful crypto payment
  async simulatePaymentSuccess(): Promise<CryptoPaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return {
      success: true,
      transactionId: `0x${Date.now().toString(16)}`,
      paymentAddress: this.getPaymentAddress('BTC')
    };
  }

  // Generate payment instructions for users
  generatePaymentInstructions(payment: CryptoPayment): string[] {
    return [
      `Send exactly ${payment.amount.toFixed(8)} ${payment.currency} to the address below:`,
      `Address: ${payment.address}`,
      `Network: ${payment.currency === 'BTC' ? 'Bitcoin' : 'Ethereum'}`,
      `⚠️ Double-check the address before sending`,
      `⏱️ Payment will be confirmed within 10-30 minutes`,
      `📧 You'll receive an email confirmation once detected`
    ];
  }
}

export default CryptoPaymentService;
