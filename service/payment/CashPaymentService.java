package service.payment;

public class CashPaymentService implements PaymentService {
    @Override
    public boolean pay(String reference, double amount) {
        System.out.printf("Registro de pago en efectivo. Ref=%s, monto=%.2f%n", reference, amount);
        return true;
    }
}