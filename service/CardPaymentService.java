package service;

public class CardPaymentService implements PaymentService {

    @Override
    public boolean processPayment(double amount) {
        System.out.println("Paid with card: $" + amount);
        return true;
    }
}
