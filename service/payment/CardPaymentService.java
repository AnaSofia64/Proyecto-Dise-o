package service.payment;

public class CardPaymentService implements PaymentService {
    @Override
    public boolean pay(String reference, double amount) {
        System.out.printf("Simulando pago con tarjeta. Ref=%s, monto=%.2f%n", reference, amount);
        return true;
    }
}