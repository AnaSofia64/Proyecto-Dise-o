package service;

public class CashPaymentService implements PaymentService {

    @Override
    public boolean processPayment(double amount) {
        System.out.println("Paid in cash: $" + amount);
        return true;
    }
}
